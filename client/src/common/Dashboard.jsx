import { useState } from "react";
import LineGraph from "./LineGraph";
import PieChart from "./PieChart";

export default function Dashboard() {
  // const [selectedDate, setSelectedDate] = useState("");
   const [filter, setFilter] = useState({
    groupBy: "date",
    value: null
  });

  return (
    <div style={{
      minHeight: "100vh",
      marginTop:"0px",
      // background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{
          marginBottom: "40px"
        }}>
          <h1 style={{
            fontSize: "36px",
            fontWeight: "700",
             background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
            marginBottom: "8px",
            letterSpacing: "-0.5px"
          }}>
            Analytics Dashboard
          </h1>
          <p style={{
            fontSize: "16px",
            color: "rgba(255, 255, 255, 0.8)",
            margin: 0
          }}>
            Monitor and analyze unsafe activities over time
          </p>
        </div>

        {/* Charts Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          alignItems: "start"
        }}>
          <LineGraph filter={filter} setFilter={setFilter} />
      <PieChart filter={filter} />
        </div>
      </div>
    </div>
  );
}