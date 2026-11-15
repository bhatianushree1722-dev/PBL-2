
import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function generatePressure() {
  return Number(
    Math.max(
      0.5,
      Math.min(4, 2.2 + (Math.random() - 0.5) * 0.8)
    ).toFixed(2)
  );
}

function createInitialData() {
  const now = Date.now();

  return Array.from({ length: 12 }, (_, index) => {
    const timestamp = now - (11 - index) * 3 * 60 * 1000;

    return {
      timestamp,
      time: new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      pressure: Number((2 + Math.random() * 0.5).toFixed(2)),
    };
  });
}

function PressureChart() {
  const [data, setData] = useState(createInitialData);

  useEffect(() => {
    const interval = setInterval(() => {
      const timestamp = Date.now();

      setData((previous) => [
        ...previous.slice(1),
        {
          timestamp,
          time: new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          pressure: generatePressure(),
        },
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="chart-card pressure-chart-card">
      {/* CHART HEADER */}
      <div className="chart-header">
        <div>
          <div className="chart-title-row">
            <h3>Pipeline Pressure</h3>

            <span className="simulated-label">
              SIMULATED
            </span>
          </div>

          <p>Simulated pipeline pressure readings.</p>
        </div>
      </div>

      {/* PRESSURE CHART */}
      <div className="chart-container">
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
              domain={[0, 4]}
              tick={{
                fontSize: 11,
                fill: "#8a9bad",
              }}
              axisLine={false}
              tickLine={false}
              unit=" bar"
            />

            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e5edf5",
                borderRadius: "10px",
                boxShadow: "0 5px 20px rgba(16, 42, 67, 0.08)",
              }}
              formatter={(value) => [
                `${Number(value).toFixed(2)} bar`,
                "Simulated Pressure",
              ]}
              labelFormatter={(label) => `Time: ${label}`}
            />

            <Line
              type="monotone"
              dataKey="pressure"
              stroke="#1683d8"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 3,
                stroke: "#ffffff",
                fill: "#1683d8",
              }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PressureChart;
