import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { useAuth } from "../../context/UserCon";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

export default function LineGraph({ filter, setFilter }) {
  const { curr } = useAuth();
  const [chartData, setChartData] = useState(null);
  const [year, setYear] = useState("");

  useEffect(() => {
    if (!curr?.user_id) return;

    const params = new URLSearchParams({
      user_id: curr.user_id,
      group_by: filter.groupBy
    });

    if (year) params.append("year", year);

    fetch(`http://127.0.0.1:8000/analytics/line?${params}`)
      .then(res => res.json())
      .then(data => {
        const labels = Object.keys(data);
        const values = Object.values(data);

        setChartData({
          labels,
          datasets: [
            {
              data: values,
              borderWidth: 3,
              tension: 0.4,
              pointRadius: 6,
              pointHoverRadius: 8,
              borderColor: "#667eea",
              backgroundColor: "rgba(102,126,234,0.1)",
              pointBackgroundColor: "#667eea",
              pointBorderColor: "#ffffff",
              pointBorderWidth: 3,
              pointHoverBackgroundColor: "#667eea",
              pointHoverBorderColor: "#ffffff",
              pointHoverBorderWidth: 3,
              fill: true
            }
          ]
        });

        // 🔥 auto-select first label so pie is always ready
        if (labels.length > 0) {
          setFilter(prev => ({
            ...prev,
            value: labels[0]
          }));
        }
      })
      .catch(err => console.error("Line chart error:", err));
  }, [curr, filter.groupBy, year, setFilter]);

  if (!chartData) {
    return <div style={{ height: "450px" }} />;
  }

  // Stats (unchanged UI behavior)
  const total = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
  const average = (total / chartData.datasets[0].data.length).toFixed(1);
  const max = Math.max(...chartData.datasets[0].data);

  return (
     <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "16px"   // spacing between stats & chart
    }}
  >
    {/* Stats Cards */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "12px"
      }}
    >
      <div style={{
        padding: "12px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>
          TOTAL
        </div>
        <div style={{ fontSize: "20px", fontWeight: "700" }}>{total}</div>
      </div>

      <div style={{
        padding: "12px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>
          AVERAGE
        </div>
        <div style={{ fontSize: "20px", fontWeight: "700" }}>{average}</div>
      </div>

      <div style={{
        padding: "12px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>
          PEAK
        </div>
        <div style={{ fontSize: "20px", fontWeight: "700" }}>{max}</div>
      </div>
    </div>

    {/* Chart Card */}
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        padding: "32px",
        height: "400px"
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{
          fontSize: "20px",
          fontWeight: "700",
          color: "#1e293b",
          margin: "0 0 8px 0"
        }}>
          Unsafe Activity Trends
        </h2>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}> 
          <select
            value={filter.groupBy}
            onChange={e =>
              setFilter(prev => ({
                ...prev,
                groupBy: e.target.value,
                value: null        // reset selection
              }))
            }
            style={{ backgroundColor: "#667eea", color: "#fff", padding: "6px 12px", borderRadius: "6px", border: "none", fontWeight: "500", cursor: "pointer" }}
          >
            <option value="date">Date</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
            <option value="weekday">Weekday</option>
          </select>

          <select value={year} onChange={e => setYear(e.target.value)}   style={{ backgroundColor: "#667eea", color: "#fff", padding: "6px 12px", borderRadius: "6px", border: "none", fontWeight: "500", cursor: "pointer" }}>
            <option value="">All Years</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>

        
      </div>

      {/* Chart */}
      <div style={{ height: "240px",paddingBottom: " 12px" }}>
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            onClick: (_, elements) => {
              if (!elements.length) return;
              const idx = elements[0].index;
              setFilter(prev => ({
                ...prev,
                value: chartData.labels[idx]
              }));
            }
          }}
        />
      </div>
    </div></div>
  );
}
