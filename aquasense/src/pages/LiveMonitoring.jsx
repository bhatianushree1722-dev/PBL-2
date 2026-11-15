
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Droplets,
  Gauge,
  RefreshCw,
  Wifi,
  Clock3,
  TrendingUp,
  CircleCheck,
  AlertTriangle,
} from "lucide-react";

import FlowChart from "../components/FlowChart";
import PressureChart from "../components/PressureChart";
import { getReadings, getDashboardSummary } from "../api";
import "../ChartLayouts.css";

function formatTime(value) {
  if (!value) return "Waiting for data";

  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function LiveMonitoring() {
  const [readings, setReadings] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadMonitoringData = useCallback(async () => {
    try {
      const [readingResult, summaryResult] = await Promise.all([
        getReadings(100),
        getDashboardSummary(),
      ]);

      setReadings(Array.isArray(readingResult) ? readingResult : []);
      setDashboard(summaryResult);
      setLastUpdated(new Date());
      setApiError("");
    } catch (error) {
      setApiError(
        error.message || "Unable to connect to AquaSense backend."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMonitoringData();

    const intervalId = setInterval(loadMonitoringData, 3000);

    const handleModeChange = () => {
      loadMonitoringData();
    };

    window.addEventListener(
      "aquasense-mode-changed",
      handleModeChange
    );

    return () => {
      clearInterval(intervalId);
      window.removeEventListener(
        "aquasense-mode-changed",
        handleModeChange
      );
    };
  }, [loadMonitoringData]);

  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    await loadMonitoringData();
  };

  const latest = dashboard?.latest;
  const today = dashboard?.today;

  const isSimulatorMode = dashboard?.mode === "simulator";
  const activeSource = isSimulatorMode ? "simulated" : "physical";

  // Only show readings belonging to the currently selected mode.
  const activeReadings = readings.filter(
    (reading) =>
      (reading.source || "physical") === activeSource
  );

  const recentReadings = activeReadings.slice(0, 6);

  // Ignore a stale reading if it belongs to the other operating mode.
  const latestMatchesMode =
    latest &&
    (latest.source || "physical") === activeSource;

  const currentReading = latestMatchesMode ? latest : null;

  const flowRate = Number(currentReading?.flowRateLpm ?? 0);
  const todayUsage = Number(today?.usageLitres ?? 0);
  const peakFlow = Number(today?.peakFlowLpm ?? 0);

  const isOnline =
    currentReading?.sensorStatus === "online";

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Waiting for data";

  const activityStatus = !currentReading
    ? "Waiting"
    : !isSimulatorMode && !isOnline
      ? "Offline"
      : flowRate === 0
        ? "No flow"
        : flowRate > 5
          ? "High flow"
          : "Flow detected";

  const activityDescription = !currentReading
    ? "Waiting for the first sensor reading."
    : !isSimulatorMode && !isOnline
      ? "The latest reading reports that the sensor is offline."
      : flowRate === 0
        ? "No water flow is reported by the latest reading."
        : flowRate > 5
          ? "Flow is elevated. Review this reading if it is unexpected."
          : "AquaSense is receiving water-flow readings.";

  const signalStrength =
    currentReading?.rssi == null
      ? "Unavailable"
      : `${currentReading.rssi} dBm`;

  return (
    <div className="page-container live-page">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span className="live-dot"></span>
            LIVE MONITORING
          </div>

          <h1>Live Monitoring</h1>

          <p>
            Monitor current water flow activity from your AquaSense device.
          </p>
        </div>

        <button
          type="button"
          className={`refresh-button ${
            refreshing ? "refreshing" : ""
          }`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={17} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* CONNECTION STATUS */}
      <div className="live-connection-card">
        <div className="connection-left">
          <div className="connection-icon">
            <Wifi size={21} />
          </div>

          <div>
            <strong>
              {apiError
                ? "Backend Connection Error"
                : !currentReading
                  ? "Waiting for Readings"
                  : isSimulatorMode
                    ? "Simulation Mode Active"
                    : isOnline
                      ? "Device Connected"
                      : "Device Offline"}
            </strong>

            <span>
              AquaSense Unit • Residential Zone 01
            </span>
          </div>
        </div>

        <div className="connection-right">
          <span className="connection-status">
            <span></span>
            {apiError
              ? "Error"
              : !currentReading
                ? "Waiting"
                : isSimulatorMode
                  ? "Simulated"
                  : isOnline
                    ? "Online"
                    : "Offline"}
          </span>

          <span className="updated-time">
            Updated {formattedTime}
          </span>
        </div>
      </div>

      {isSimulatorMode && (
        <p className="simulation-notice">
          Demo mode — flow and pressure readings are simulated,
          not measurements from physical hardware.
        </p>
      )}

      {apiError && (
        <p className="simulation-notice">
          {apiError}
        </p>
      )}

      {/* LIVE METRICS */}
      <div className="live-metrics-grid">
        <div className="live-metric-card primary">
          <div className="live-metric-icon">
            <Activity size={22} />
          </div>

          <div className="live-metric-content">
            <span>Current Flow Rate</span>

            <div className="metric-number">
              {currentReading ? flowRate.toFixed(2) : "—"}
              <small>L/min</small>
            </div>

            <div className="metric-status normal">
              <CircleCheck size={14} />
              {isSimulatorMode ? "Simulated reading" : activityStatus}
            </div>
          </div>

          <div className="metric-live-label">
            {currentReading ? "LIVE" : "WAITING"}
          </div>
        </div>

        <div className="live-metric-card">
          <div className="live-metric-icon blue">
            <Droplets size={22} />
          </div>

          <div className="live-metric-content">
            <span>Today's Usage</span>

            <div className="metric-number">
              {todayUsage.toFixed(2)}
              <small>L</small>
            </div>

            <div className="metric-subtext">
              Backend usage summary
            </div>
          </div>
        </div>

        <div className="live-metric-card">
          <div className="live-metric-icon orange">
            <Gauge size={22} />
          </div>

          <div className="live-metric-content">
            <span>Peak Flow Today</span>

            <div className="metric-number">
              {peakFlow.toFixed(2)}
              <small>L/min</small>
            </div>

            <div className="metric-subtext">
              Highest recorded flow
            </div>
          </div>
        </div>

        <div className="live-metric-card">
          <div className="live-metric-icon green">
            <TrendingUp size={22} />
          </div>

          <div className="live-metric-content">
            <span>System State</span>

            <div className="system-state">
              <span className="state-dot"></span>
              {activityStatus}
            </div>

            <div className="metric-subtext">
              {currentReading
                ? "Based on latest reading"
                : "No data yet"}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE CHARTS */}
      <div
        className={`live-charts-stack ${
          isSimulatorMode ? "simulator" : "normal"
        }`}
      >
        <FlowChart
          title="Live Water Flow"
          subtitle="Flow measurements recorded by the AquaSense backend."
          source={activeSource}
        />

        {isSimulatorMode && <PressureChart />}
      </div>

      {/* LOWER SECTION */}
      <div className="live-bottom-grid">
        {/* CURRENT ACTIVITY */}
        <div className="live-panel">
          <div className="panel-header">
            <div>
              <h3>Current Activity</h3>
              <p>Latest system observation</p>
            </div>

            <span className="panel-status normal">
              <CircleCheck size={14} />
              {activityStatus}
            </span>
          </div>

          <div className="activity-main">
            <div className="activity-icon">
              <Droplets size={25} />
            </div>

            <div>
              <strong>
                {!currentReading
                  ? "Waiting for sensor data"
                  : flowRate > 0
                    ? "Water flow reported"
                    : "No water flow reported"}
              </strong>

              <p>{activityDescription}</p>
            </div>
          </div>

          <div className="activity-details">
            <div>
              <span>Current flow</span>
              <strong>
                {currentReading
                  ? `${flowRate.toFixed(2)} L/min`
                  : "—"}
              </strong>
            </div>

            <div>
              <span>Observation</span>
              <strong>{activityStatus}</strong>
            </div>

            <div>
              <span>Last update</span>
              <strong>{formattedTime}</strong>
            </div>
          </div>
        </div>

        {/* DEVICE INFO */}
        <div className="live-panel">
          <div className="panel-header">
            <div>
              <h3>Device Information</h3>
              <p>Connection and monitoring details</p>
            </div>

            <Wifi size={20} className="device-online-icon" />
          </div>

          <div className="device-info-list">
            <div className="device-info-row">
              <span>Device</span>
              <strong>
                {dashboard?.deviceId || "aquasense-01"}
              </strong>
            </div>

            <div className="device-info-row">
              <span>Location</span>
              <strong>Residential Zone 01</strong>
            </div>

            <div className="device-info-row">
              <span>Connection</span>
              <strong className="online-text">
                <span></span>
                {!currentReading
                  ? "Waiting"
                  : isSimulatorMode
                    ? "Simulation"
                    : isOnline
                      ? "Online"
                      : "Offline"}
              </strong>
            </div>

            {!isSimulatorMode && (
              <div className="device-info-row">
                <span>Signal strength</span>
                <strong>{signalStrength}</strong>
              </div>
            )}

            {isSimulatorMode && (
              <div className="device-info-row">
                <span>Pressure sensor</span>
                <strong>Simulated</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECENT READINGS */}
      <div className="readings-panel">
        <div className="panel-header">
          <div>
            <h3>Recent Readings</h3>
            <p>
              Latest flow measurements from the active data source.
            </p>
          </div>

          <Clock3 size={20} />
        </div>

        <div className="readings-table-wrapper">
          <table className="readings-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Flow Rate</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading && recentReadings.length === 0 ? (
                <tr>
                  <td colSpan="4">Loading readings...</td>
                </tr>
              ) : recentReadings.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    No readings received from the active source yet.
                  </td>
                </tr>
              ) : (
                recentReadings.map((reading) => (
                  <tr key={reading.id}>
                    <td>{formatTime(reading.receivedAt)}</td>

                    <td>
                      <strong>
                        {Number(reading.flowRateLpm).toFixed(2)}
                      </strong>{" "}
                      L/min
                    </td>

                    <td>
                      {reading.source === "simulated"
                        ? "Simulated"
                        : "Physical"}
                    </td>

                    <td>
                      <span className="reading-status">
                        <span></span>
                        {reading.sensorStatus || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INFORMATION NOTE */}
      <div className="monitoring-note">
        <div className="monitoring-note-icon">
          <AlertTriangle size={18} />
        </div>

        <div>
          <strong>About abnormal flow detection</strong>
          <p>
            AquaSense identifies unusual water-flow patterns for review.
            An observation does not independently confirm or locate a
            physical leak.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LiveMonitoring;
