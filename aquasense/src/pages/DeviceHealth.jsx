
import { useCallback, useEffect, useState } from "react";
import {
  Cpu,
  Wifi,
  BatteryCharging,
  RefreshCw,
  CheckCircle2,
  Radio,
  Clock3,
  Activity,
  ShieldCheck,
  Server,
  Signal,
  Zap,
  AlertTriangle,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

function DeviceHealth() {
  const [lastSync, setLastSync] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const [error, setError] = useState("");

  const checkDeviceStatus = useCallback(async () => {
    setRefreshing(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}`);
      }

      await response.json();

      setConnectionStatus("online");
      setLastSync(new Date());
    } catch (err) {
      setConnectionStatus("offline");
      setError(
        err.message || "Unable to connect to the AquaSense backend."
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkDeviceStatus();

    const interval = setInterval(checkDeviceStatus, 15000);

    return () => clearInterval(interval);
  }, [checkDeviceStatus]);

  const formattedSyncTime = lastSync
    ? lastSync.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Not synchronized";

  const isOnline = connectionStatus === "online";
  const isChecking = connectionStatus === "checking";

  return (
    <div className="page-container device-health-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <Cpu size={13} />
            DEVICE STATUS
          </div>

          <h1>Device Health</h1>

          <p>
            Monitor the connection and operational status of your
            AquaSense prototype.
          </p>
        </div>

        <button
          type="button"
          className={`refresh-button ${refreshing ? "refreshing" : ""}`}
          onClick={checkDeviceStatus}
          disabled={refreshing}
        >
          <RefreshCw size={17} />
          {refreshing ? "Checking..." : "Check Status"}
        </button>
      </div>

      {/* MAIN DEVICE STATUS */}
      <div className="device-health-hero">
        <div className="device-health-hero-left">
          <div className="device-health-main-icon">
            <Cpu size={30} />
          </div>

          <div>
            <div className="device-health-name-row">
              <h2>AquaSense Unit 01</h2>

              <span
                className="device-online-badge"
                style={{
                  background: isOnline ? undefined : "#fff1f0",
                  color: isOnline ? undefined : "#dc2626",
                }}
              >
                <span
                  style={{
                    background: isOnline ? undefined : "#dc2626",
                  }}
                ></span>
                {isChecking
                  ? "Checking"
                  : isOnline
                    ? "Online"
                    : "Offline"}
              </span>
            </div>

            <p>
              Residential Zone 01 • Smart Water Monitoring Device
            </p>

            <div className="device-health-sync">
              <Clock3 size={13} />
              Last successful backend check: {formattedSyncTime}
            </div>
          </div>
        </div>

        <div className="device-health-hero-right">
          <div>
            <span>Backend Connection</span>
            <strong>
              {isChecking ? "Checking" : isOnline ? "Connected" : "Offline"}
            </strong>
          </div>

          <div className="health-score-ring">
            {isOnline ? (
              <CheckCircle2 size={29} />
            ) : (
              <AlertTriangle size={27} />
            )}
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            marginTop: "16px",
            borderRadius: "10px",
            background: "#fff1f0",
            color: "#b42318",
            fontSize: "13px",
          }}
          role="alert"
        >
          <AlertTriangle size={17} />
          <span>{error}</span>
        </div>
      )}

      {/* HEALTH METRICS */}
      <div className="device-health-grid">
        <div className="health-metric-card">
          <div className="health-metric-icon green">
            <Wifi size={21} />
          </div>

          <div>
            <span>Backend Connection</span>
            <strong>
              {isChecking ? "Checking" : isOnline ? "Online" : "Offline"}
            </strong>
            <p>API health endpoint</p>
          </div>

          {isOnline && (
            <CheckCircle2 className="health-check" size={17} />
          )}
        </div>

        <div className="health-metric-card">
          <div className="health-metric-icon blue">
            <Signal size={21} />
          </div>

          <div>
            <span>API Status</span>
            <strong>{isOnline ? "Healthy" : "Unavailable"}</strong>
            <p>Backend response check</p>
          </div>

          {isOnline && (
            <CheckCircle2 className="health-check" size={17} />
          )}
        </div>

        <div className="health-metric-card">
          <div className="health-metric-icon orange">
            <BatteryCharging size={21} />
          </div>

          <div>
            <span>Power Supply</span>
            <strong>USB Powered</strong>
            <p>Prototype power source</p>
          </div>

          <CheckCircle2 className="health-check" size={17} />
        </div>

        <div className="health-metric-card">
          <div className="health-metric-icon blue">
            <Activity size={21} />
          </div>

          <div>
            <span>Sensor Type</span>
            <strong>Flow Sensor</strong>
            <p>Physical flow monitoring</p>
          </div>

          <CheckCircle2 className="health-check" size={17} />
        </div>
      </div>

      {/* LOWER GRID */}
      <div className="device-health-lower-grid">
        {/* DEVICE INFORMATION */}
        <div className="device-health-panel">
          <div className="health-panel-header">
            <div>
              <h3>Device Information</h3>
              <p>Hardware and software details</p>
            </div>

            <Server size={19} />
          </div>

          <div className="device-info-table">
            <div className="device-health-row">
              <span>Device Name</span>
              <strong>AquaSense Unit 01</strong>
            </div>

            <div className="device-health-row">
              <span>Controller</span>
              <strong>ESP8266 NodeMCU</strong>
            </div>

            <div className="device-health-row">
              <span>Firmware</span>
              <strong>Prototype</strong>
            </div>

            <div className="device-health-row">
              <span>Device ID</span>
              <strong>AS-ESP8266-001</strong>
            </div>

            <div className="device-health-row">
              <span>Location</span>
              <strong>Residential Zone 01</strong>
            </div>

            <div className="device-health-row">
              <span>Network</span>
              <strong>Wi-Fi</strong>
            </div>
          </div>
        </div>

        {/* DIAGNOSTICS */}
        <div className="device-health-panel">
          <div className="health-panel-header">
            <div>
              <h3>System Diagnostics</h3>
              <p>Available connection checks</p>
            </div>

            <ShieldCheck size={19} />
          </div>

          <div className="diagnostics-list">
            <div className="diagnostic-row">
              <div className="diagnostic-icon green">
                <Server size={15} />
              </div>

              <div>
                <strong>Backend Connection</strong>
                <span>
                  {isChecking
                    ? "Checking connection"
                    : isOnline
                      ? "Connected successfully"
                      : "Connection unavailable"}
                </span>
              </div>

              {isOnline ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
            </div>

            <div className="diagnostic-row">
              <div className="diagnostic-icon green">
                <Radio size={15} />
              </div>

              <div>
                <strong>Flow Sensor</strong>
                <span>Physical sensor configured</span>
              </div>

              <CheckCircle2 size={16} />
            </div>

            <div className="diagnostic-row">
              <div className="diagnostic-icon green">
                <Zap size={15} />
              </div>

              <div>
                <strong>Power Supply</strong>
                <span>USB-powered prototype</span>
              </div>

              <CheckCircle2 size={16} />
            </div>

            <div className="diagnostic-row">
              <div className="diagnostic-icon green">
                <Activity size={15} />
              </div>

              <div>
                <strong>Last Health Check</strong>
                <span>{formattedSyncTime}</span>
              </div>

              {isOnline ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PERFORMANCE */}
      <div className="device-health-performance">
        <div className="health-panel-header">
          <div>
            <h3>System Overview</h3>
            <p>Prototype configuration and connectivity</p>
          </div>

          <Activity size={19} />
        </div>

        <div className="performance-grid">
          <div className="performance-item">
            <div className="performance-item-top">
              <span>Controller</span>
              <Cpu size={15} />
            </div>

            <strong>ESP8266</strong>

            <div className="performance-bar">
              <span style={{ width: "100%" }}></span>
            </div>

            <small>NodeMCU development board</small>
          </div>

          <div className="performance-item">
            <div className="performance-item-top">
              <span>Monitoring</span>
              <Activity size={15} />
            </div>

            <strong>Flow Rate</strong>

            <div className="performance-bar">
              <span style={{ width: "100%" }}></span>
            </div>

            <small>Water flow sensor</small>
          </div>

          <div className="performance-item">
            <div className="performance-item-top">
              <span>Communication</span>
              <Radio size={15} />
            </div>

            <strong>Wi-Fi</strong>

            <div className="performance-bar">
              <span style={{ width: "100%" }}></span>
            </div>

            <small>ESP8266 connectivity</small>
          </div>

          <div className="performance-item">
            <div className="performance-item-top">
              <span>Backend API</span>
              <Server size={15} />
            </div>

            <strong>{isOnline ? "Available" : "Unavailable"}</strong>

            <div className="performance-bar">
              <span
                style={{
                  width: isOnline ? "100%" : "0%",
                  background: isOnline ? undefined : "#dc2626",
                }}
              ></span>
            </div>

            <small>
              {isOnline ? "Health check successful" : "Check backend server"}
            </small>
          </div>
        </div>
      </div>

      {/* MAINTENANCE */}
      <div className="maintenance-card">
        <div className="maintenance-icon">
          <ShieldCheck size={21} />
        </div>

        <div className="maintenance-content">
          <strong>
            {isOnline
              ? "Backend is responding normally"
              : "Backend connection needs attention"}
          </strong>

          <p>
            {isOnline
              ? "The AquaSense backend health endpoint is responding. Keep the controller connected to power and Wi-Fi for continuous monitoring."
              : "Check that your backend server is running on port 3001 and that the device and computer have network connectivity."}
          </p>
        </div>

        <div className="maintenance-status">
          {isOnline ? "Connection healthy" : "Check connection"}
        </div>
      </div>
    </div>
  );
}

export default DeviceHealth;
