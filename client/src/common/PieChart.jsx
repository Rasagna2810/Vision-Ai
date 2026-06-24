import { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { useAuth } from "../../context/UserCon";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChart({ filter }) {
  const { curr } = useAuth();
  const [data, setData] = useState(null);
  const [total, setTotal] = useState(0);
  const [breakdown, setBreakdown] = useState({
    FIRE: 0,
    SMOKING: 0,
    VEHICLE: 0
  });

  useEffect(() => {
    if (!filter?.value || !curr?.user_id) return;

    fetch(
      `http://127.0.0.1:8000/analytics/pie?` +
      `user_id=${curr.user_id}&group_by=${filter.groupBy}&value=${filter.value}`
    )
      .then(res => res.json())
      .then(res => {
        const fire = res.FIRE || 0;
        const smoking = res.SMOKING || 0;
        const vehicle = res.VEHICLE || 0;
        const sum = fire + smoking + vehicle;

        setTotal(sum);
        setBreakdown({ FIRE: fire, SMOKING: smoking, VEHICLE: vehicle });

        setData({
          labels: ["Fire", "Smoking", "Vehicle"],
          datasets: [
            {
              data: [fire, smoking, vehicle],
              backgroundColor: [
                "#153794", // Fire
                "#576cb0", // Smoking
                "#9cbcef"  // Vehicle
              ],
              borderColor: "#ffffff",
              borderWidth: 4,
              hoverOffset: 8,
              hoverBorderColor: "#ffffff",
              hoverBorderWidth: 4
            }
          ]
        });
      })
      .catch(err => console.error("Pie chart error:", err));
  }, [filter, curr]);

  if (!filter?.value) {
    return (
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        padding: "32px",
        height: "450px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b"
      }}>
        Click on the line chart to view breakdown
      </div>
    );
  }

  if (!data) return null;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#ffffff",
        bodyColor: "#cbd5e1",
        borderColor: "#667eea",
        borderWidth: 2,
        cornerRadius: 12,
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed;
            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${ctx.label}: ${value} (${percent}%)`;
          }
        }
      }
    },
    cutout: "70%",
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800
    }
  };

  const categories = [
    { name: "Fire", value: breakdown.FIRE, color: "#153794" },
    { name: "Smoking", value: breakdown.SMOKING, color: "#576cb0" },
    { name: "Vehicle", value: breakdown.VEHICLE, color: "#9cbcef" }
  ];

  return (
    <div style={{
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      marginTop: "40px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
      padding: "32px",
      height: "450px"
    }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{
          fontSize: "20px",
          fontWeight: "700",
          color: "#1e293b",
          margin: "0 0 4px 0"
        }}>
          Activity Breakdown
        </h2>
        <p style={{
          fontSize: "14px",
          color: "#64748b",
          margin: 0
        }}>
          {filter.groupBy.toUpperCase()} : {filter.value}
        </p>
      </div>

      {total === 0 ? (
        <div style={{
          height: "calc(100% - 80px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            backgroundColor: "#f0fdf4",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px"
          }}>
            <span style={{ fontSize: "40px" }}>🎉</span>
          </div>
          <h3 style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#16a34a",
            margin: "0 0 8px 0"
          }}>
            No Incidents
          </h3>
          <p style={{
            fontSize: "14px",
            color: "#64748b",
            margin: 0
          }}>
            Great job on safety!
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          alignItems: "center",
          height: "calc(100% - 80px)"
        }}>
          {/* Donut */}
          <div style={{ position: "relative", height: "220px" }}>
            <Doughnut data={data} options={options} />
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none"
            }}>
              <div style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#263a53"
              }}>
                {total}
              </div>
              <div style={{
                fontSize: "12px",
                color: "#54647c",
                fontWeight: "500"
              }}>
                Total
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {categories.map(cat => {
              const percent = total > 0 ? ((cat.value / total) * 100).toFixed(0) : 0;
              return (
                <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    backgroundColor: cat.color
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1e293b"
                    }}>
                      {cat.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#c7d0db" }}>
                      {cat.value} incidents
                    </div>
                  </div>
                  <div style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: cat.color
                  }}>
                    {percent}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
