
const express = require("express");
const db = require("../database");

const router = express.Router();

const ML_SERVICE_URL = "http://127.0.0.1:8000";
const DEFAULT_LIMIT = 5000;
const MAX_LIMIT = 5000;

// GET /api/ml/anomalies?source=simulated&limit=5000
router.get("/anomalies", async (req, res) => {
  const source = req.query.source || "simulated";

  if (!["physical", "simulated"].includes(source)) {
    return res.status(400).json({
      success: false,
      message: "Source must be physical or simulated.",
    });
  }

  const requestedLimit = Number.parseInt(req.query.limit, 10);

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  try {
    // Fetch the latest readings, then restore chronological order.
    const readings = db.prepare(`
      SELECT id, deviceId, flowRateLpm, receivedAt, source
      FROM (
        SELECT id, deviceId, flowRateLpm, receivedAt, source
        FROM readings
        WHERE source = ?
        ORDER BY id DESC
        LIMIT ?
      )
      ORDER BY id ASC
    `).all(source, limit);

    if (readings.length === 0) {
      return res.json({
        success: true,
        source,
        status: "no_data",
        readingsAvailable: 0,
        results: [],
        message: `No ${source} readings are available.`,
      });
    }

    // Send only flow-rate values to the Python ML service.
    const mlResponse = await fetch(`${ML_SERVICE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source,
        readings: readings.map((reading) => ({
          flowRateLpm: reading.flowRateLpm,
        })),
      }),
      signal: AbortSignal.timeout(60000),
    });

    const mlResult = await mlResponse.json();

    if (!mlResponse.ok) {
      return res.status(mlResponse.status).json({
        success: false,
        message: "The ML service could not analyse the readings.",
        details: mlResult,
      });
    }

    // Attach database IDs and timestamps to the ML results.
    const enrichedResults = (mlResult.results || []).map((result) => ({
      ...result,
      readingId: readings[result.index]?.id ?? null,
      receivedAt: readings[result.index]?.receivedAt ?? null,
      deviceId: readings[result.index]?.deviceId ?? null,
    }));

    return res.json({
      ...mlResult,
      source,
      readingsAvailable: readings.length,
      results: enrichedResults,
    });
  } catch (error) {
    console.error("AquaSense ML route error:", error.message);

    return res.status(503).json({
      success: false,
      message: "Unable to connect to the AquaSense ML service.",
      error: error.message,
    });
  }
});

module.exports = router;
