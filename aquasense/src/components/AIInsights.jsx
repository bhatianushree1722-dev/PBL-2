
import { useEffect, useState } from "react";

import {
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  Info,
} from "lucide-react";

import { getReadings } from "../api";
import "./AIInsights.css";

// Convert backend timestamps into JavaScript timestamps.
function parseTimestamp(value) {
  if (!value) return NaN;

  const text = String(value).trim();

  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
  );

  if (match) {
    return Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6])
    );
  }

  return new Date(text).getTime();
}

function AIInsights({ source = "simulated" }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update current time every 10 seconds.
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // Fetch and analyze sensor readings.
  useEffect(() => {
    let cancelled = false;

    async function loadReadings() {
      try {
        const result = await getReadings(100);

        const rows = Array.isArray(result)
          ? result
          : Array.isArray(result?.readings)
            ? result.readings
            : [];

        const filtered = rows
          .filter(
            (item) => (item.source || "physical") === source
          )
          .map((item) => ({
            ...item,
            timestamp: parseTimestamp(item.receivedAt),
            flow: Number(item.flowRateLpm),
          }))
          .filter(
            (item) =>
              Number.isFinite(item.timestamp) &&
              Number.isFinite(item.flow)
          )
          .sort((a, b) => a.timestamp - b.timestamp);

        if (!cancelled) {
          setReadings(filtered);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to analyze sensor readings."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReadings();

    const interval = setInterval(loadReadings, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [source]);

  const latest = readings[readings.length - 1];

  // Identify whether the latest reading is historical.
  const isHistorical =
    latest && currentTime - latest.timestamp > 120000;

  // Default insight.
  let insight = {
    type: "normal",
    title: "Water Flow Looks Normal",
    description:
      "The latest recorded flow is within the expected operating range.",
    recommendation:
      "Continue monitoring water usage for unusual changes.",
    icon: CheckCircle2,
  };

  // Analyze high-flow readings.
  if (latest && latest.flow >= 5) {
    const highFlowCount = readings
      .slice(-5)
      .filter((item) => item.flow >= 5).length;

    if (highFlowCount >= 3) {
      insight = {
        type: "warning",
        title: "Unusual High Flow Detected",
        description:
          "Multiple recent readings show flow above 5 L/min. This may indicate unusually high consumption or a possible leak.",
        recommendation:
          "Inspect connected pipelines and check whether water is being used continuously.",
        icon: AlertTriangle,
      };
    } else {
      insight = {
        type: "info",
        title: "High Flow Observation",
        description:
          "A high-flow reading was recorded. More readings are needed to determine whether this pattern continues.",
        recommendation:
          "Monitor upcoming readings and check for unexpected water usage.",
        icon: Info,
      };
    }
  }

  // Analyze zero-flow readings.
  else if (latest && latest.flow === 0) {
    insight = {
      type: "info",
      title: "No Water Flow Detected",
      description:
        "The latest sensor reading reports zero water flow.",
      recommendation:
        "If water usage is expected, check the pipeline and flow sensor connection.",
      icon: Info,
    };
  }

  const InsightIcon = insight.icon;

  return (
    <section className="ai-insights">

      {/* HEADER */}
      <div className="ai-insights-header">
        <div className="ai-heading-left">
          <div className="ai-icon">
            <BrainCircuit size={22} />
          </div>

          <div>
            <h3>AI Insights</h3>
            <p>Intelligent water-flow observations</p>
          </div>
        </div>

        <span className="ai-prototype-badge">
          PROTOTYPE
        </span>
      </div>

      {/* ANALYSIS INFORMATION */}
      <div className="ai-analysis-meta">
        <span>
          <span className="ai-status-dot" />
          Rule-based analysis
        </span>

        <span>
          {source === "simulated"
            ? "Simulated data"
            : "Physical data"}
        </span>
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div className="ai-empty">
          <RefreshCw size={18} className="ai-spin" />
          Analyzing sensor readings...
        </div>
      ) : error ? (
        /* ERROR STATE */
        <div className="ai-empty">
          <Info size={19} />
          {error}
        </div>
      ) : !latest ? (
        /* NO DATA STATE */
        <div className="ai-empty">
          <Info size={19} />
          No readings available for analysis from this data source.
        </div>
      ) : (
        <>
          {/* AI RESULT */}
          <div className={`ai-result ${insight.type}`}>
            <div className="ai-result-icon">
              <InsightIcon size={21} />
            </div>

            <div className="ai-result-content">
              <h4>{insight.title}</h4>
              <p>{insight.description}</p>
            </div>
          </div>

          {/* RECOMMENDATION */}
          <div className="ai-recommendation">
            <Lightbulb size={19} />

            <div>
              <strong>Recommended Action</strong>
              <p>{insight.recommendation}</p>
            </div>
          </div>

          {/* HISTORICAL DATA NOTICE */}
          {isHistorical && (
            <p className="ai-historical-note">
              These are historical readings, not live sensor observations.
            </p>
          )}

          {/* FOOTER */}
          <div className="ai-footer">
            <span>
              Latest flow: {latest.flow.toFixed(2)} L/min
            </span>

            <span>
              {new Date(latest.timestamp).toLocaleString()}
            </span>
          </div>
        </>
      )}
    </section>
  );
}

export default AIInsights;
