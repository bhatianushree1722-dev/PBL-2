
import { useMemo, useState } from "react";
import {
  History as HistoryIcon,
  CalendarDays,
  Search,
  ChevronDown,
  ChevronUp,
  Droplets,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
} from "lucide-react";

const historyRecords = [
  {
    id: 1,
    date: "28 Sep 2026",
    time: "02:14 AM",
    type: "Possible Abnormal Flow",
    flow: "1.3",
    duration: "32 min",
    status: "Attention",
    severity: "warning",
    note: "Flow remained active for longer than the expected pattern during this period.",
  },
  {
    id: 2,
    date: "27 Sep 2026",
    time: "11:32 PM",
    type: "High-Flow Observation",
    flow: "8.7",
    duration: "4 min",
    status: "Observation",
    severity: "info",
    note: "A short period of elevated flow was observed.",
  },
  {
    id: 3,
    date: "27 Sep 2026",
    time: "10:05 PM",
    type: "Normal Operation Resumed",
    flow: "2.1",
    duration: "—",
    status: "Normal",
    severity: "normal",
    note: "Flow returned to the expected operating range.",
  },
  {
    id: 4,
    date: "27 Sep 2026",
    time: "06:48 PM",
    type: "Normal Flow",
    flow: "4.4",
    duration: "18 min",
    status: "Normal",
    severity: "normal",
    note: "Water flow remained within the expected operating range.",
  },
  {
    id: 5,
    date: "27 Sep 2026",
    time: "01:22 PM",
    type: "Normal Flow",
    flow: "3.8",
    duration: "12 min",
    status: "Normal",
    severity: "normal",
    note: "Normal water usage activity was recorded.",
  },
  {
    id: 6,
    date: "26 Sep 2026",
    time: "09:17 PM",
    type: "High-Flow Observation",
    flow: "9.2",
    duration: "3 min",
    status: "Observation",
    severity: "info",
    note: "Elevated flow was observed briefly before returning to normal.",
  },
  {
    id: 7,
    date: "26 Sep 2026",
    time: "07:42 PM",
    type: "Normal Flow",
    flow: "4.8",
    duration: "21 min",
    status: "Normal",
    severity: "normal",
    note: "Flow activity matched the expected household usage pattern.",
  },
  {
    id: 8,
    date: "25 Sep 2026",
    time: "08:14 AM",
    type: "Normal Flow",
    flow: "5.1",
    duration: "16 min",
    status: "Normal",
    severity: "normal",
    note: "Normal morning water activity was recorded.",
  },
];

const dateOptions = [
  "Today",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
];

function History() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [dateRange, setDateRange] = useState("Last 7 Days");
  const [showDateMenu, setShowDateMenu] = useState(false);

  const filteredRecords = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return historyRecords.filter((record) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Normal" && record.severity === "normal") ||
        (filter === "Attention" && record.severity === "warning") ||
        (filter === "Observation" && record.severity === "info");

      const searchableText = [
        record.type,
        record.date,
        record.time,
        record.flow,
        record.duration,
        record.status,
        record.note,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && searchableText.includes(searchText);
    });
  }, [filter, search]);

  const abnormalCount = historyRecords.filter(
    (record) => record.severity === "warning"
  ).length;

  const observationCount = historyRecords.filter(
    (record) => record.severity === "info"
  ).length;

  const normalCount = historyRecords.filter(
    (record) => record.severity === "normal"
  ).length;

  return (
    <div className="page-container history-page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <HistoryIcon size={13} />
            HISTORICAL RECORDS
          </div>

          <h1>History</h1>

          <p>
            Review previous water-flow observations and system activity.
          </p>
        </div>

        <div className="history-date-wrapper">
          <button
            type="button"
            className="history-date-range"
            onClick={() => setShowDateMenu((previous) => !previous)}
            aria-expanded={showDateMenu}
            aria-haspopup="true"
          >
            <CalendarDays size={16} />
            <span>{dateRange}</span>
            <ChevronDown
              size={15}
              className={showDateMenu ? "date-chevron-open" : ""}
            />
          </button>

          {showDateMenu && (
            <div className="history-date-menu">
              {dateOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={dateRange === option ? "selected" : ""}
                  onClick={() => {
                    setDateRange(option);
                    setShowDateMenu(false);
                  }}
                >
                  <span>{option}</span>
                  {dateRange === option && (
                    <span className="date-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="history-summary-grid">
        <div className="history-summary-card">
          <div className="history-summary-icon blue">
            <HistoryIcon size={20} />
          </div>
          <div>
            <span>Total Records</span>
            <strong>{historyRecords.length}</strong>
            <p>Recorded observations</p>
          </div>
        </div>

        <div className="history-summary-card">
          <div className="history-summary-icon green">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span>Normal Records</span>
            <strong>{normalCount}</strong>
            <p>Expected flow activity</p>
          </div>
        </div>

        <div className="history-summary-card">
          <div className="history-summary-icon orange">
            <Activity size={20} />
          </div>
          <div>
            <span>Observations</span>
            <strong>{observationCount}</strong>
            <p>Elevated flow periods</p>
          </div>
        </div>

        <div className="history-summary-card">
          <div className="history-summary-icon red">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span>Attention</span>
            <strong>{abnormalCount}</strong>
            <p>Requires review</p>
          </div>
        </div>
      </div>

      <div className="history-toolbar">
        <div className="history-filters">
          {["All", "Normal", "Observation", "Attention"].map((item) => (
            <button
              type="button"
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="history-search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search records..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search history records"
          />
        </div>
      </div>

      <div className="history-records-card">
        <div className="history-records-header">
          <div>
            <h3>Flow History</h3>
            <p>
              {filteredRecords.length} record
              {filteredRecords.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="history-header-label">
            <Clock3 size={15} />
            Latest first
          </div>
        </div>

        <div className="history-list">
          {filteredRecords.length === 0 ? (
            <div className="history-empty">
              <Search size={25} />
              <strong>No records found</strong>
              <p>Try changing the filter or search term.</p>
            </div>
          ) : (
            filteredRecords.map((record) => {
              const isExpanded = expandedId === record.id;

              return (
                <div
                  className={`history-record ${
                    isExpanded ? "expanded" : ""
                  }`}
                  key={record.id}
                >
                  <button
                    type="button"
                    className="history-record-main"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : record.id)
                    }
                    aria-expanded={isExpanded}
                  >
                    <div
                      className={`history-record-icon ${record.severity}`}
                    >
                      {record.severity === "warning" ? (
                        <AlertTriangle size={18} />
                      ) : record.severity === "info" ? (
                        <Activity size={18} />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
                    </div>

                    <div className="history-record-title">
                      <strong>{record.type}</strong>
                      <span>
                        {record.date} • {record.time}
                      </span>
                    </div>

                    <div className="history-record-flow">
                      <strong>{record.flow}</strong>
                      <span>L/min</span>
                    </div>

                    <div className="history-record-duration">
                      <span>Duration</span>
                      <strong>{record.duration}</strong>
                    </div>

                    <div
                      className={`history-record-status ${record.severity}`}
                    >
                      {record.status}
                    </div>

                    <div className="history-expand">
                      {isExpanded ? (
                        <ChevronUp size={17} />
                      ) : (
                        <ChevronDown size={17} />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="history-record-details">
                      <div className="history-detail-grid">
                        <div>
                          <span>Observed Flow</span>
                          <strong>{record.flow} L/min</strong>
                        </div>

                        <div>
                          <span>Duration</span>
                          <strong>{record.duration}</strong>
                        </div>

                        <div>
                          <span>Recorded Date</span>
                          <strong>{record.date}</strong>
                        </div>

                        <div>
                          <span>Recorded Time</span>
                          <strong>{record.time}</strong>
                        </div>
                      </div>

                      <div className="history-detail-note">
                        <div>
                          <Droplets size={17} />
                        </div>
                        <p>
                          <strong>System note:</strong> {record.note}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="history-pagination">
          <span>
            Showing {filteredRecords.length} of {historyRecords.length} records
          </span>

          <div>
            <button type="button" disabled>
              Previous
            </button>
            <button type="button" className="active">
              1
            </button>
            <button type="button" disabled>
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="history-information">
        <div className="history-information-icon">
          <AlertTriangle size={17} />
        </div>

        <div>
          <strong>How to interpret these records</strong>
          <p>
            AquaSense records flow patterns and highlights unusual
            observations for review. A historical abnormal-flow observation
            does not independently confirm or locate a physical leak.
          </p>
        </div>
      </div>
    </div>
  );
}

export default History;
