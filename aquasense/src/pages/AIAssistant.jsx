
import { useEffect, useState } from "react";
import {
  Bot,
  Droplets,
  Activity,
  ShieldAlert,
  ChartNoAxesCombined,
  Send,
  Sparkles,
  User,
  RefreshCw,
} from "lucide-react";

import { getDashboardSummary } from "../api";

const suggestions = [
  {
    icon: Droplets,
    title: "Water usage",
    question: "How much water have I used today?",
  },
  {
    icon: Activity,
    title: "Flow analysis",
    question: "What is my current flow rate?",
  },
  {
    icon: ShieldAlert,
    title: "Leak prevention",
    question: "Is there any possible leakage?",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Reading summary",
    question: "Summarize my recent water readings.",
  },
];

function formatNumber(value, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

function getTimestamp(value) {
  if (!value) return "Timestamp unavailable";

  const date = new Date(value.replace(" ", "T") + "Z");

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function generateAnswer(question, dashboard) {
  const q = question.toLowerCase();

  const latest = dashboard?.latest;
  const today = dashboard?.today;
  const readings = dashboard?.recentReadings || [];

  if (!dashboard) {
    return "I couldn't retrieve your AquaSense readings just now. Please check your connection and try again.";
  }

  const source =
    dashboard.source === "simulated" ? "Simulated" : "Physical";

  const flow = Number(latest?.flowRateLpm ?? 0);
  const usage = Number(today?.usageLitres ?? 0);
  const peak = Number(today?.peakFlowLpm ?? 0);

  if (
    q.includes("today") ||
    q.includes("consumption") ||
    q.includes("used") ||
    q.includes("usage")
  ) {
    return `Your AquaSense system has recorded ${formatNumber(
      usage
    )} litres of water usage today. Your highest recorded flow today was ${formatNumber(
      peak
    )} L/min. This information comes from your ${source.toLowerCase()} readings.`;
  }

  if (
    q.includes("current flow") ||
    q.includes("flow rate") ||
    q.includes("flow analysis")
  ) {
    if (!latest) {
      return "AquaSense hasn't received a reading from the active data source yet.";
    }

    return `Your latest recorded water flow is ${formatNumber(
      flow
    )} L/min. The reading was recorded at ${getTimestamp(
      latest.receivedAt
    )}. Your system is currently using ${source.toLowerCase()} data.`;
  }

  if (
    q.includes("leak") ||
    q.includes("leakage") ||
    q.includes("abnormal")
  ) {
    if (readings.length < 3) {
      return "There aren't enough recent readings to assess unusual flow patterns reliably. AquaSense needs more observations before it can flag a possible abnormality.";
    }

    const recent = readings
      .slice(0, 10)
      .map((reading) => Number(reading.flowRateLpm))
      .filter(Number.isFinite);

    const baseline =
      recent.reduce((sum, value) => sum + value, 0) /
      recent.length;

    const elevated = recent.filter(
      (value) => value > Math.max(5, baseline * 1.8)
    );

    if (elevated.length >= 3) {
      return `AquaSense has noticed elevated flow in ${elevated.length} of the latest ${recent.length} readings. The average of these readings is ${formatNumber(
        baseline
      )} L/min. This pattern deserves attention, but it does not confirm a leak. Check your taps, valves and pipeline connections.`;
    }

    return `AquaSense has not identified a persistent high-flow pattern in the latest ${recent.length} readings. This is not proof that there is no leakage. Continue monitoring your water flow and investigate any unexplained usage.`;
  }

  if (
    q.includes("summary") ||
    q.includes("recent reading") ||
    q.includes("readings")
  ) {
    if (!readings.length) {
      return "No recent readings are available from the active data source yet.";
    }

    const values = readings
      .map((reading) => Number(reading.flowRateLpm))
      .filter(Number.isFinite);

    const average =
      values.reduce((sum, value) => sum + value, 0) /
      values.length;

    const maximum = Math.max(...values);

    return `Here is your recent AquaSense summary:\n\n• Readings analysed: ${values.length}\n• Average flow: ${formatNumber(average)} L/min\n• Highest recent flow: ${formatNumber(maximum)} L/min\n• Latest flow: ${formatNumber(flow)} L/min\n• Data source: ${source}\n\nThese are recorded observations, not a confirmed diagnosis of pipeline conditions.`;
  }

  if (
    q.includes("recommend") ||
    q.includes("what should") ||
    q.includes("advice")
  ) {
    if (flow > 5) {
      return "Your latest flow reading is relatively high. Check whether water is being used intentionally. If all taps and appliances are off, inspect visible connections and valves for possible leakage.";
    }

    return "Keep monitoring your water consumption, inspect visible pipeline connections periodically, and investigate unexplained flow when water is not being used. AquaSense can help you identify patterns over time.";
  }

  return `I'm AquaSense Assistant! I can currently help explain your water usage, latest flow readings, recent patterns and basic leakage indicators.\n\nTry asking: "What is my current flow rate?" or "How much water have I used today?"`;
}

function AIAssistant() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      const data = await getDashboardSummary();
      setDashboard(data);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to connect to AquaSense.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, 5000);

    return () => clearInterval(interval);
  }, []);

  function askQuestion(value = question) {
    const text = value.trim();

    if (!text || sending) return;

    setSending(true);

    const answer = generateAnswer(text, dashboard);

    setMessages((previous) => [
      ...previous,
      { role: "user", text },
      { role: "assistant", text: answer },
    ]);

    setQuestion("");
    setSending(false);
  }

  return (
    <section className="ai-page">
      <div className="ai-page-header">
        <div className="ai-page-icon">
          <Bot size={28} />
        </div>

        <div>
          <p className="ai-eyebrow">AQUASENSE INTELLIGENCE</p>
          <h1>AI Assistant</h1>
          <p>
            Your intelligent companion for understanding water usage
            and monitoring unusual flow patterns.
          </p>
        </div>
      </div>

      <div className="ai-chat-card">
        <div className="ai-welcome">
          <div className="ai-bot-avatar">
            <Sparkles size={23} />
          </div>

          <h2>How can I help you today?</h2>

          <p>
            Ask me about your water consumption, flow readings
            or possible pipeline abnormalities.
          </p>
        </div>

        <div className="ai-connection-status">
          <span
            className={`ai-status-dot ${
              error || !dashboard ? "offline" : "online"
            }`}
          />
          <span>
            {loading
              ? "Connecting to AquaSense..."
              : error
                ? "Connection unavailable"
                : `Connected · ${
                    dashboard.source === "simulated"
                      ? "Simulation Mode"
                      : "Normal Mode"
                  }`}
          </span>

          <button
            type="button"
            onClick={loadDashboard}
            aria-label="Refresh readings"
            title="Refresh readings"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {error && (
          <p className="ai-error">
            Unable to retrieve readings. Please check your backend.
          </p>
        )}

        {messages.length === 0 && (
          <div className="ai-suggestions">
            {suggestions.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  type="button"
                  className="ai-suggestion"
                  key={item.title}
                  onClick={() => askQuestion(item.question)}
                >
                  <Icon size={21} />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.question}</small>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {messages.length > 0 && (
          <div className="ai-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`ai-message ${message.role}`}
              >
                <div className="ai-message-avatar">
                  {message.role === "assistant" ? (
                    <Bot size={17} />
                  ) : (
                    <User size={17} />
                  )}
                </div>

                <p style={{ whiteSpace: "pre-line" }}>
                  {message.text}
                </p>
              </div>
            ))}
          </div>
        )}

        <form
          className="ai-input-form"
          onSubmit={(event) => {
            event.preventDefault();
            askQuestion();
          }}
        >
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about your water system..."
            aria-label="Ask AquaSense Assistant"
          />

          <button
            type="submit"
            disabled={!question.trim() || sending}
            aria-label="Send question"
          >
            <Send size={19} />
          </button>
        </form>

        <p className="ai-disclaimer">
          AquaSense insights are generated using sensor readings
          and predefined analysis rules. Possible leakage indicators
          are not confirmed diagnoses.
        </p>
      </div>
    </section>
  );
}

export default AIAssistant;
