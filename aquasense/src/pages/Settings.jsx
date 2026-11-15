
import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  UserCircle,
  Bell,
  ShieldAlert,
  Wifi,
  Save,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Info,
  Cpu,
} from "lucide-react";

const STORAGE_KEY = "aquasense-user-settings";

const defaultSettings = {
  emailAlerts: true,
  abnormalFlowAlerts: true,
  highFlowAlerts: true,
  deviceOfflineAlerts: true,
  dailySummary: true,
  flowThreshold: 8,
  monitoringInterval: 5,
};

function getInitialSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      return {
        ...defaultSettings,
        ...JSON.parse(stored),
      };
    }
  } catch (error) {
    console.error("Unable to load AquaSense settings:", error);
  }

  return { ...defaultSettings };
}

function Settings() {
  const [settings, setSettings] = useState(getInitialSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Keep settings loaded from local browser storage.
  }, []);

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
    } catch (error) {
      console.error("Unable to save AquaSense settings:", error);
      setSaved(false);
      alert("Unable to save settings in this browser.");
    }
  };

  const handleReset = () => {
    setSettings({ ...defaultSettings });
    setSaved(false);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Unable to reset AquaSense settings:", error);
    }
  };

  const renderToggle = (key, label) => (
    <button
      type="button"
      className={`settings-toggle ${settings[key] ? "active" : ""}`}
      onClick={() => updateSetting(key, !settings[key])}
      aria-label={`Toggle ${label}`}
      aria-pressed={settings[key]}
    >
      <span></span>
    </button>
  );

  return (
    <div className="page-container settings-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <SettingsIcon size={13} />
            SYSTEM CONFIGURATION
          </div>

          <h1>Settings</h1>

          <p>
            Manage your AquaSense monitoring and notification preferences.
          </p>
        </div>
      </div>

      {/* SAVE MESSAGE */}
      {saved && (
        <div className="settings-saved-message" role="status">
          <CheckCircle2 size={17} />
          <span>Your settings have been saved successfully.</span>
        </div>
      )}

      {/* PROFILE */}
      <section className="settings-section">
        <div className="settings-section-header">
          <div className="settings-section-icon blue">
            <UserCircle size={20} />
          </div>

          <div>
            <h3>Profile</h3>
            <p>Your AquaSense account information.</p>
          </div>
        </div>

        <div className="settings-profile-card">
          <div className="settings-avatar">
            <UserCircle size={36} />
          </div>

          <div className="settings-profile-info">
            <strong>User</strong>
            <span>AquaSense account</span>
          </div>

          <button
            type="button"
            className="settings-outline-button"
            disabled
            title="Profile editing is not configured yet"
          >
            Edit Profile
            <ChevronRight size={14} />
          </button>
        </div>
      </section>

      {/* NOTIFICATIONS */}
      <section className="settings-section">
        <div className="settings-section-header">
          <div className="settings-section-icon orange">
            <Bell size={20} />
          </div>

          <div>
            <h3>Notifications</h3>
            <p>Choose which AquaSense events should generate alerts.</p>
          </div>
        </div>

        <div className="settings-options">
          <div className="settings-option">
            <div className="settings-option-icon">
              <Bell size={17} />
            </div>

            <div className="settings-option-content">
              <strong>Email Notifications</strong>
              <span>
                Enable your preference for important AquaSense email alerts.
              </span>
            </div>

            {renderToggle("emailAlerts", "email notifications")}
          </div>

          <div className="settings-option">
            <div className="settings-option-icon warning">
              <ShieldAlert size={17} />
            </div>

            <div className="settings-option-content">
              <strong>Abnormal Flow Alerts</strong>
              <span>
                Enable alerts for unusual flow patterns requiring attention.
              </span>
            </div>

            {renderToggle("abnormalFlowAlerts", "abnormal flow alerts")}
          </div>

          <div className="settings-option">
            <div className="settings-option-icon blue">
              <Wifi size={17} />
            </div>

            <div className="settings-option-content">
              <strong>Device Offline Alerts</strong>
              <span>
                Enable notifications when the AquaSense device stops communicating.
              </span>
            </div>

            {renderToggle("deviceOfflineAlerts", "device offline alerts")}
          </div>

          <div className="settings-option">
            <div className="settings-option-icon green">
              <CheckCircle2 size={17} />
            </div>

            <div className="settings-option-content">
              <strong>Daily Summary</strong>
              <span>
                Enable your preference for a daily water-flow activity summary.
              </span>
            </div>

            {renderToggle("dailySummary", "daily summary")}
          </div>
        </div>
      </section>

      {/* MONITORING */}
      <section className="settings-section">
        <div className="settings-section-header">
          <div className="settings-section-icon blue">
            <ShieldAlert size={20} />
          </div>

          <div>
            <h3>Monitoring</h3>
            <p>
              Configure your preferred water-flow monitoring parameters.
            </p>
          </div>
        </div>

        <div className="settings-options">
          {/* FLOW THRESHOLD */}
          <div className="settings-range-option">
            <div className="settings-option-content">
              <strong>High-Flow Threshold</strong>

              <span>
                Flow above this value can be highlighted as an
                elevated-flow observation.
              </span>
            </div>

            <div className="settings-range-control">
              <strong>{settings.flowThreshold} L/min</strong>

              <input
                type="range"
                min="5"
                max="15"
                step="0.5"
                value={settings.flowThreshold}
                onChange={(event) =>
                  updateSetting(
                    "flowThreshold",
                    Number(event.target.value)
                  )
                }
                aria-label="High-flow threshold in litres per minute"
              />

              <div className="range-labels">
                <span>5</span>
                <span>15 L/min</span>
              </div>
            </div>
          </div>

          {/* MONITORING INTERVAL */}
          <div className="settings-select-option">
            <div className="settings-option-content">
              <strong>Monitoring Interval Preference</strong>

              <span>
                Preferred interval for device reading transmission.
              </span>
            </div>

            <select
              value={settings.monitoringInterval}
              onChange={(event) =>
                updateSetting(
                  "monitoringInterval",
                  Number(event.target.value)
                )
              }
              aria-label="Monitoring interval preference"
            >
              <option value="1">Every 1 minute</option>
              <option value="5">Every 5 minutes</option>
              <option value="10">Every 10 minutes</option>
              <option value="15">Every 15 minutes</option>
            </select>
          </div>

          {/* HIGH FLOW */}
          <div className="settings-option">
            <div className="settings-option-icon orange">
              <ShieldAlert size={17} />
            </div>

            <div className="settings-option-content">
              <strong>High-Flow Observations</strong>
              <span>
                Enable your preference for highlighting unusually high
                water-flow periods.
              </span>
            </div>

            {renderToggle("highFlowAlerts", "high-flow observations")}
          </div>
        </div>
      </section>

      {/* DEVICE */}
      <section className="settings-section">
        <div className="settings-section-header">
          <div className="settings-section-icon green">
            <Wifi size={20} />
          </div>

          <div>
            <h3>Connected Device</h3>
            <p>Current AquaSense prototype configuration.</p>
          </div>
        </div>

        <div className="settings-device-card">
          <div className="settings-device-status">
            <div className="settings-device-icon">
              <Cpu size={21} />
            </div>

            <div>
              <strong>AquaSense Unit 01</strong>
              <span>ESP8266 NodeMCU • Flow Sensor</span>
            </div>
          </div>

          <div className="settings-device-online">
            <span></span>
            Configured
          </div>
        </div>

        <div className="settings-info-note">
          <Info size={16} />

          <p>
            Device hardware settings are currently managed through the
            prototype firmware and backend. These preferences do not
            directly change the ESP8266 configuration.
          </p>
        </div>
      </section>

      {/* ACTIONS */}
      <div className="settings-actions">
        <button
          type="button"
          className="settings-reset-button"
          onClick={handleReset}
        >
          <RotateCcw size={16} />
          Reset Changes
        </button>

        <button
          type="button"
          className="settings-save-button"
          onClick={handleSave}
        >
          <Save size={16} />
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default Settings;
