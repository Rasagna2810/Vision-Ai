import { useEffect, useState } from "react";
import { MdDelete } from "react-icons/md";
import { useAuth } from "../../context/UserCon";
import { GoDotFill } from "react-icons/go";
import "./History.css";

function History() {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState([]);
  const { curr } = useAuth();

  useEffect(() => {
    if (!curr?.user_id) return;

    fetch(`http://127.0.0.1:8000/history/${curr.user_id}`)
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setHistory(sorted);
      });
  }, [curr?.user_id]);

  const groupedHistory = history.reduce((acc, item) => {
    acc[item.date] = acc[item.date] || [];
    acc[item.date].push(item);
    return acc;
  }, {});

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    await fetch("http://127.0.0.1:8000/history/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected })
    });

    setHistory(prev => prev.filter(item => !selected.includes(item._id)));
    setSelected([]);
  };

  return (
    <div className="history-container">

      {selected.length > 0 && (
        <MdDelete className="delete-icon" onClick={deleteSelected} />
      )}

      {Object.keys(groupedHistory).map(date => (
        <div key={date} className="date-group">
          <h5 className="date-heading">{date}</h5>

          {/* Header Row */}
          {/* <div className="history-row header">
            <span></span>
            <span>Status</span>
            <span>Confidence</span>
          </div> */}
         <div className="history-row">
          {groupedHistory[date].map(item => (
            <div key={item._id} className="history-item ">
              <input
                type="checkbox"
                checked={selected.includes(item._id)}
                onChange={() => toggleSelect(item._id)}
              />
              <p >
  <GoDotFill
    style={{
      color: item.status === "UNSAFE" ? "red" : "green",
      marginRight: "6px"
    }}
  />
  {item.status}
</p>

              <p >Confidence Score:{item.confidence_score}%</p>
              <hr/>
            </div>
      
          ))}
        </div></div>
      ))}
       
    </div>
  );
}

export default History;
