
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getReadings } from "../api";

const RANGE_MS = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
};

// SQLite CURRENT_TIMESTAMP values are UTC.
function parseTimestamp(value) {
  if (!value) return NaN;

  const text = String(value).trim();

  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/
  );

  if (match) {
    const [
      ,
      year,
      month,
      day,
      hour,
      minute,
      second,
      fraction,
    ] = match;

    return Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Number((fraction || "0").slice(0, 3).padEnd(3, "0"))
    );
  }

  return new Date(text).getTime();
}

function FlowChart({
  title = "Live Water Flow",
  subtitle = "Water flow activity recorded by AquaSense.",
  source = "simulated",
}) {
  const [range, setRange] = useState("1h");
  const [isLive, setIsLive] = useState(true);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setNow(Date.now());
    }, 3000);

    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadReadings() {
      try {
        const result = await getReadings(500);

        const rows = Array.isArray(result)
          ? result
          : Array.isArray(result?.readings)
            ? result.readings
            : [];

        if (!cancelled) {
          setReadings(rows);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load flow readings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReadings();

    if (!isLive) {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = setInterval(loadReadings, 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [isLive]);

  const chartResult = useMemo(() => {
    const cutoff = now - RANGE_MS[range];

    const selectedReadings = readings
      .filter((reading) => {
        return (reading.source || "physical") === source;
      })
      .map((reading) => ({
        timestamp: parseTimestamp(reading.receivedAt),
        flow: Number(reading.flowRateLpm),
      }))
      .filter(({ timestamp, flow }) => {
        return (
          Number.isFinite(timestamp) &&
          Number.isFinite(flow)
        );
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    const recentReadings = selectedReadings.filter(
      (reading) =>
        reading.timestamp >= cutoff &&
        reading.timestamp <= now + 60000
    );

    // If there are no readings in the selected period,
    // show the latest available historical readings instead.
    const usingHistoricalData = recentReadings.length === 0;

    const visibleReadings = usingHistoricalData
      ? selectedReadings.slice(-60)
      : recentReadings;

    const data = visibleReadings.map(({ timestamp, flow }) => ({
      timestamp,
      time: new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        ...(range === "1h" ? { second: "2-digit" } : {}),
      }),
      flow: Number(flow.toFixed(2)),
    }));

    const latestTimestamp =
      selectedReadings.length > 0
        ? selectedReadings[selectedReadings.length - 1].timestamp
        : null;

    const isFresh =
      latestTimestamp !== null &&
      now - latestTimestamp <= 120000 &&
      now >= latestTimestamp - 60000;

    return {
      data,
      usingHistoricalData,
      isFresh,
      latestTimestamp,
    };
  }, [readings, range, now, source]);

  const { data, usingHistoricalData, isFresh, latestTimestamp } =
    chartResult;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title-row">
            <h3>{title}</h3>

            {isFresh && isLive && (
              <span className="live-indicator">
                <span></span>
                LIVE
              </span>
            )}

            {usingHistoricalData && data.length > 0 && (
              <span className="simulated-label">
                HISTORICAL DATA
              </span>
            )}
          </div>

          <p>{subtitle}</p>
        </div>

        <div className="chart-controls">
          <button
            className={`chart-live-button ${isLive ? "active" : ""}`}
            onClick={() => setIsLive((previous) => !previous)}
          >
            {isLive ? "Pause" : "Resume"}
          </button>

          <select
            className="chart-select"
            value={range}
            onChange={(event) => setRange(event.target.value)}
          >
            <option value="1h">Last 1 Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="simulation-notice">
          Chart error: {error}
        </p>
      )}

      {usingHistoricalData && data.length > 0 && (
        <p className="simulation-notice">
          No recent readings available. Showing the latest stored
          readings from this data source.
          {latestTimestamp !== null &&
            ` Last recorded: ${new Date(
              latestTimestamp
            ).toLocaleString()}`}
        </p>
      )}

      <div className="chart-container">
        {loading ? (
          <p>Loading flow readings...</p>
        ) : error && data.length === 0 ? (
          <p>Unable to load chart data. Check the backend connection.</p>
        ) : data.length === 0 ? (
          <p>
            No readings are available for the selected data source.
            Start the simulator or connect your physical device.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#edf2f7"
              />

              <XAxis
                dataKey="time"
                tick={{
                  fontSize: 11,
                  fill: "#8a9bad",
                }}
                axisLine={false}
                tickLine={false}
                minTickGap={25}
              />

              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "#8a9bad",
                }}
                axisLine={false}
                tickLine={false}
                domain={[0, "auto"]}
                unit=" L/min"
              />

              <Tooltip
                contentStyle={{
                  border: "1px solid #e5edf5",
                  borderRadius: "10px",
                  boxShadow: "0 5px 20px rgba(16, 42, 67, 0.08)",
                }}
                formatter={(value) => [
                  `${Number(value).toFixed(2)} L/min`,
                  "Flow",
                ]}
                labelFormatter={(label) => `Time: ${label}`}
              />

              <Line
                type="monotone"
                dataKey="flow"
                stroke="#1683d8"
                strokeWidth={3}
                dot={false}
                isAnimationActive={true}
                activeDot={{
                  r: 5,
                  strokeWidth: 3,
                  stroke: "#ffffff",
                  fill: "#1683d8",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default FlowChart;
