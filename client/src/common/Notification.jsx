import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/UserCon.jsx";

function Notification() {
  const [note, setNote] = useState([]);
  const { curr } = useAuth();

  useEffect(() => {
    if (!curr?.user_id) return;

    fetch(`http://127.0.0.1:8000/notification/${curr.user_id}`)
      .then((res) => res.json())
      .then((data) => setNote(data));
  }, [curr?.user_id]);

  const deleteNotification = async (id) => {
    await fetch(`http://127.0.0.1:8000/notification/${id}`, {
      method: "DELETE",
    });

    // remove from UI instantly
    setNote((prev) => prev.filter((n) => n._id !== id));
  };

  const timeAgo = (time) => {
    const now = new Date();
    const past = new Date(time);
    const diff = Math.floor((now - past) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
    return `${Math.floor(diff / 86400)} day(s) ago`;
  };

  return (
    <div className="notification-container">
      {note.length === 0 && <p>No notifications</p>}

      {note.map((n) => (
        <div key={n._id} className="notification-row">
          <div>
            <p className="message">{n.message}</p>
            <span className="time">{timeAgo(n.timestamp)}</span>
          </div>

          <button
            className="delete-btn"
            onClick={() => deleteNotification(n._id)}
          >
            X
          </button>
        </div>
      ))}
    </div>
  );
}

export default Notification;
