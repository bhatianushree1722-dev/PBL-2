
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Droplets,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  BarChart3,
  Clock3,
  Lightbulb,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getReadings, getDashboardSummary } from "../api";

const DAY_MS = 24 * 60 * 60 * 1000;

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

function getLocalDateKey(timestamp) {
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLocalDayStart(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function Consumption() {
  const [range, setRange] = useState("7d");
  const [readings, setReadings] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConsumptionData = useCallback(async () => {
    try {
      const [readingResult, summaryResult] = await Promise.all([
        getReadings(1000),
        getDashboardSummary(),
      ]);

      setReadings(
        Array.isArray(readingResult) ? readingResult : []
      );

      setDashboard(summaryResult);
      setError("");
    } catch (err) {
      setError(
        err.message || "Unable to load consumption data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConsumptionData();

    const intervalId = setInterval(
      loadConsumptionData,
      10000
    );

    const handleModeChange = () => {
      loadConsumptionData();
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
  }, [loadConsumptionData]);

  const isSimulatorMode = dashboard?.mode === "simulator";

  const activeSource = isSimulatorMode
    ? "simulated"
    : "physical";

  // Keep physical and simulated readings separate.
  const activeReadings = useMemo(() => {
    return readings
      .filter((reading) => {
        const source = reading.source || "physical";
        return source === activeSource;
      })
      .map((reading) => {
        const timestamp = parseTimestamp(reading.receivedAt);
        const flow = Number(reading.flowRateLpm);
        const intervalMs = Number(reading.intervalMs);

        const validTimestamp = Number.isFinite(timestamp);

        const validFlow =
          reading.flowRateLpm != null &&
          Number.isFinite(flow) &&
          flow >= 0;

        const validInterval =
          reading.intervalMs != null &&
          Number.isFinite(intervalMs) &&
          intervalMs > 0;

        if (
          !validTimestamp ||
          !validFlow ||
          !validInterval
        ) {
          return null;
        }

        return {
          ...reading,
          timestamp,
          flow,
          intervalMs,
          usage: (flow * intervalMs) / 60000,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [readings, activeSource]);

  const calculated = useMemo(() => {
    const now = new Date();
    const todayStart = getLocalDayStart(now);
    const selectedDays = range === "7d" ? 7 : 30;

    const selectedStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (selectedDays - 1)
    ).getTime();

    const previousStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (selectedDays * 2 - 1)
    ).getTime();

    const dailyMap = new Map();

    for (let index = 0; index < selectedDays; index += 1) {
      const date = new Date(selectedStart);
      date.setDate(date.getDate() + index);

      const timestamp = date.getTime();
      const key = getLocalDateKey(timestamp);

      dailyMap.set(key, {
        timestamp,
        day:
          range === "7d"
            ? date.toLocaleDateString("en-IN", {
                weekday: "short",
              })
            : formatDate(timestamp),
        usage: 0,
        readingCount: 0,
      });
    }

    const hourlyMap = new Map();

    for (let hour = 0; hour < 24; hour += 1) {
      hourlyMap.set(hour, {
        usage: 0,
        readingCount: 0,
      });
    }

    const previousDailyMap = new Map();

    activeReadings.forEach((reading) => {
      const readingDate = new Date(reading.timestamp);
      const dayStart = getLocalDayStart(readingDate);
      const key = getLocalDateKey(reading.timestamp);

      if (
        dayStart >= selectedStart &&
        dayStart <= todayStart
      ) {
        const day = dailyMap.get(key);

        if (day) {
          day.usage += reading.usage;
          day.readingCount += 1;
        }
      }

      if (
        reading.timestamp >= previousStart &&
        reading.timestamp < selectedStart
      ) {
        const previousDay = previousDailyMap.get(key) || {
          usage: 0,
          readingCount: 0,
        };

        previousDay.usage += reading.usage;
        previousDay.readingCount += 1;

        previousDailyMap.set(key, previousDay);
      }

      if (dayStart === todayStart) {
        const hour = readingDate.getHours();
        const bucket = hourlyMap.get(hour);

        if (bucket) {
          bucket.usage += reading.usage;
          bucket.readingCount += 1;
        }
      }
    });

    // Missing readings remain null, not zero.
    const dailyData = Array.from(dailyMap.values()).map(
      (item) => ({
        ...item,
        usage:
          item.readingCount > 0
            ? Number(item.usage.toFixed(2))
            : null,
      })
    );

    const observedDays = dailyData.filter(
      (item) => item.readingCount > 0
    );

    const totalUsage = observedDays.reduce(
      (sum, item) => sum + item.usage,
      0
    );

    const daysWithData = observedDays.length;

    const averageUsage =
      daysWithData > 0
        ? totalUsage / daysWithData
        : 0;

    const peakDay = observedDays.reduce(
      (highest, current) =>
        highest == null || current.usage > highest.usage
          ? current
          : highest,
      null
    );

    const previousDays = Array.from(
      previousDailyMap.values()
    ).filter((item) => item.readingCount > 0);

    const previousTotal = previousDays.reduce(
      (sum, item) => sum + item.usage,
      0
    );

    const previousAverage =
      previousDays.length > 0
        ? previousTotal / previousDays.length
        : 0;

    const comparison =
      previousDays.length > 0 && previousAverage > 0
        ? ((averageUsage - previousAverage) /
            previousAverage) *
          100
        : null;

    // Aggregate daily readings into weekly totals.
    let chartData = dailyData;

    if (range === "30d") {
      chartData = [];

      for (
        let start = 0;
        start < dailyData.length;
        start += 7
      ) {
        const week = dailyData.slice(start, start + 7);

        const weekReadings = week.reduce(
          (sum, item) => sum + item.readingCount,
          0
        );

        const weekUsage = week.reduce(
          (sum, item) => sum + (item.usage ?? 0),
          0
        );

        chartData.push({
          day: `Week ${chartData.length + 1}`,
          usage:
            weekReadings > 0
              ? Number(weekUsage.toFixed(2))
              : null,
          readingCount: weekReadings,
        });
      }
    }

    // Today's hourly usage.
    const hourlySlots = [
      { hour: 0, time: "12 AM" },
      { hour: 3, time: "3 AM" },
      { hour: 6, time: "6 AM" },
      { hour: 9, time: "9 AM" },
      { hour: 12, time: "12 PM" },
      { hour: 15, time: "3 PM" },
      { hour: 18, time: "6 PM" },
      { hour: 21, time: "9 PM" },
    ];

    const hourlyData = hourlySlots.map(
      (slot, index, slots) => {
        const endHour =
          index === slots.length - 1
            ? 24
            : slots[index + 1].hour;

        let usage = 0;
        let readingCount = 0;

        for (
          let hour = slot.hour;
          hour < endHour;
          hour += 1
        ) {
          const bucket = hourlyMap.get(hour);

          usage += bucket.usage;
          readingCount += bucket.readingCount;
        }

        return {
          time: slot.time,
          usage:
            readingCount > 0
              ? Number(usage.toFixed(2))
              : null,
          readingCount,
        };
      }
    );

    const observedHourlyData = hourlyData.filter(
      (item) => item.readingCount > 0
    );

    const peakHour = observedHourlyData.reduce(
      (highest, current) =>
        highest == null || current.usage > highest.usage
          ? current
          : highest,
      null
    );

    const todayReadingCount = observedHourlyData.reduce(
      (sum, item) => sum + item.readingCount,
      0
    );

    const todayCoverage = observedHourlyData.length;

    const hasReliableHourlyCoverage =
      todayReadingCount >= 3 && todayCoverage >= 2;

    return {
      chartData,
      totalUsage,
      averageUsage,
      peakDay,
      daysWithData,
      comparison,
      hourlyData,
      peakHour,
      todayReadingCount,
      todayCoverage,
      hasReliableHourlyCoverage,
    };
  }, [activeReadings, range]);

  const {
    chartData,
    totalUsage,
    averageUsage,
    peakDay,
    daysWithData,
    comparison,
    hourlyData,
    peakHour,
    todayReadingCount,
    todayCoverage,
    hasReliableHourlyCoverage,
  } = calculated;

  const hasData = activeReadings.length > 0;

  const maxHourlyUsage = Math.max(
    1,
    ...hourlyData
      .filter((item) => item.usage != null)
      .map((item) => item.usage)
  );

  const comparisonText =
    comparison == null
      ? "Not enough previous-period data"
      : `${Math.abs(comparison).toFixed(1)}% ${
          comparison <= 0 ? "lower" : "higher"
        } than previous period`;

  const peakInsight = hasReliableHourlyCoverage
    ? `Your highest recorded usage is around ${peakHour.time}.`
    : "More readings are needed for a reliable usage pattern.";

  return (
    <div className="page-container consumption-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <BarChart3 size={13} />
            WATER CONSUMPTION
          </div>

          <h1>Consumption</h1>

          <p>
            Understand how water usage changes across your home over time.
          </p>

          <p className="consumption-mode-label">
            {isSimulatorMode
              ? "Simulation Mode — displaying simulated consumption."
              : "Normal Mode — displaying physical sensor consumption."}
          </p>
        </div>

        <div className="consumption-range">
          <button
            type="button"
            className={range === "7d" ? "active" : ""}
            onClick={() => setRange("7d")}
          >
            7 Days
          </button>

          <button
            type="button"
            className={range === "30d" ? "active" : ""}
            onClick={() => setRange("30d")}
          >
            30 Days
          </button>
        </div>
      </div>

      {error && (
        <div className="consumption-note">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="consumption-summary-grid">
        <div className="consumption-stat-card">
          <div className="consumption-stat-icon blue">
            <Droplets size={21} />
          </div>

          <div>
            <span>Total Consumption</span>

            <strong>
              {loading ? "—" : formatNumber(totalUsage)}
              <small> L</small>
            </strong>

            <p>Across the selected period</p>
          </div>
        </div>

        <div className="consumption-stat-card">
          <div className="consumption-stat-icon green">
            {comparison != null && comparison > 0 ? (
              <TrendingUp size={21} />
            ) : (
              <TrendingDown size={21} />
            )}
          </div>

          <div>
            <span>Daily Average</span>

            <strong>
              {loading ? "—" : formatNumber(averageUsage)}
              <small> L/day</small>
            </strong>

            <p className="positive-change">
              {comparisonText}
            </p>
          </div>
        </div>

        <div className="consumption-stat-card">
          <div className="consumption-stat-icon orange">
            <TrendingUp size={21} />
          </div>

          <div>
            <span>Peak Usage</span>

            <strong>
              {loading
                ? "—"
                : peakDay
                  ? formatNumber(peakDay.usage)
                  : "—"}
              <small> L</small>
            </strong>

            <p>
              {peakDay
                ? `${peakDay.day} • ${peakDay.readingCount} readings`
                : "No recorded data"}
            </p>
          </div>
        </div>

        <div className="consumption-stat-card">
          <div className="consumption-stat-icon blue">
            <CalendarDays size={21} />
          </div>

          <div>
            <span>Current Period</span>

            <strong>
              {range === "7d" ? "7" : "30"}
              <small> days</small>
            </strong>

            <p>{daysWithData} days with readings</p>
          </div>
        </div>
      </div>

      {/* MAIN CHART */}
      <div className="consumption-chart-card">
        <div className="consumption-chart-header">
          <div>
            <h3>Water Consumption</h3>

            <p>
              {range === "7d"
                ? "Daily water usage for the last 7 days."
                : "Weekly water usage for the last 30 days."}
            </p>
          </div>

          <div className="chart-unit">
            <Droplets size={15} />
            Litres
          </div>
        </div>

        <div className="consumption-chart">
          {loading ? (
            <p>Loading consumption data...</p>
          ) : !hasData ? (
            <p>
              No readings are available for the selected operating mode.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -15,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#edf2f7"
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "#8799a8",
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "#8799a8",
                  }}
                />

                <Tooltip
                  cursor={{ fill: "#f5f9fc" }}
                  contentStyle={{
                    border: "1px solid #e5edf5",
                    borderRadius: "10px",
                    boxShadow:
                      "0 5px 20px rgba(16, 42, 67, 0.08)",
                  }}
                  formatter={(value) => [
                    value == null
                      ? "No data"
                      : `${formatNumber(value)} L`,
                    "Usage",
                  ]}
                  labelFormatter={(label) => label}
                />

                <Bar
                  dataKey="usage"
                  fill="#1683d8"
                  radius={[6, 6, 0, 0]}
                  barSize={range === "7d" ? 42 : 70}
                  isAnimationActive={true}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <p className="consumption-chart-footnote">
          Days without valid readings are shown as gaps, not zero consumption.
        </p>
      </div>

      {/* LOWER GRID */}
      <div className="consumption-lower-grid">
        {/* HOURLY USAGE */}
        <div className="consumption-panel">
          <div className="panel-header">
            <div>
              <h3>Today's Usage Pattern</h3>
              <p>Recorded consumption throughout today.</p>
            </div>

            <Clock3 size={19} />
          </div>

          <div className="hourly-list">
            {hourlyData.map((item) => (
              <div className="hourly-row" key={item.time}>
                <span>{item.time}</span>

                <div className="hourly-bar-track">
                  {item.usage != null && (
                    <div
                      className="hourly-bar"
                      style={{
                        width: `${
                          (item.usage / maxHourlyUsage) * 100
                        }%`,
                      }}
                    />
                  )}
                </div>

                <strong>
                  {item.usage == null
                    ? "No data"
                    : `${formatNumber(item.usage)} L`}
                </strong>
              </div>
            ))}

            {todayReadingCount === 0 && (
              <p>
                No valid readings have been recorded today.
              </p>
            )}
          </div>
        </div>

        {/* INSIGHT */}
        <div className="consumption-panel insight-panel">
          <div className="insight-icon">
            <Lightbulb size={22} />
          </div>

          <div className="insight-content">
            <span className="insight-label">
              AQUASENSE INSIGHT
            </span>

            <h3>{peakInsight}</h3>

            <p>
              {hasReliableHourlyCoverage
                ? "This is based on multiple recorded measurements across different time windows. It describes observed readings, not a complete household usage pattern."
                : "AquaSense needs at least three valid readings across two or more time windows before highlighting a peak usage period."}
            </p>

            <div className="insight-stat">
              <div>
                <span>Peak time window</span>

                <strong>
                  {hasReliableHourlyCoverage
                    ? peakHour.time
                    : "Insufficient data"}
                </strong>
              </div>

              <div>
                <span>Observed usage</span>

                <strong>
                  {hasReliableHourlyCoverage
                    ? `${formatNumber(peakHour.usage)} L`
                    : "—"}
                </strong>
              </div>
            </div>

            <p className="insight-coverage">
              Today's coverage: {todayReadingCount} valid readings
              across {todayCoverage} time windows.
            </p>
          </div>
        </div>
      </div>

      {/* COMPARISON */}
      <div className="consumption-comparison">
        <div className="comparison-icon">
          {comparison != null && comparison > 0 ? (
            <TrendingUp size={20} />
          ) : (
            <TrendingDown size={20} />
          )}
        </div>

        <div className="comparison-content">
          <strong>
            {comparison == null
              ? "Previous-period comparison is unavailable."
              : comparison <= 0
                ? "Usage is below the previous monitoring period."
                : "Usage is above the previous monitoring period."}
          </strong>

          <p>
            {comparison == null
              ? "More historical readings are needed to calculate a reliable comparison."
              : `Average daily consumption is ${Math.abs(
                  comparison
                ).toFixed(1)}% ${
                  comparison <= 0 ? "lower" : "higher"
                } than the previous comparable period.`}
          </p>
        </div>

        {comparison != null && (
          <div className="comparison-value">
            {comparison <= 0 ? "↓" : "↑"}{" "}
            {Math.abs(comparison).toFixed(1)}%
          </div>
        )}
      </div>

      {/* NOTE */}
      <div className="consumption-note">
        Consumption is calculated from recorded flow rate and
        measurement interval. Missing readings and invalid measurement
        intervals are not treated as zero consumption. Simulation Mode
        values are demonstration data, not physical sensor measurements.
      </div>
    </div>
  );
}

export default Consumption;
