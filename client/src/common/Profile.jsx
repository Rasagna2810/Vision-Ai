import { useEffect, useState } from "react";
import { useAuth } from "../../context/UserCon";
import { TbCurrentLocation } from "react-icons/tb";
import { FaRegEdit } from "react-icons/fa";
import "./profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [location, setLocation] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const { curr, setcurr } = useAuth();

  // 🔹 Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/getp/${curr.user_id}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();
        setProfile(data);
        setFirstName(data.firstName);
        setLocation(data.location || "");
      } catch (err) {
        setError(err.message);
      }
    };

    if (curr?.user_id) {
      fetchProfile();
    }
  }, [curr]);

  // 🔹 Save updates
  const saveProfile = async () => {
    setError("");

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/upp/${curr.user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            firstName,
            location
          })
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail?.[0]?.msg || "Update failed");
      }

      setProfile({ ...profile, firstName, location });
      setcurr({ ...curr, firstName });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // 📍 Get current location
  const useCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const loc = `Lat ${pos.coords.latitude.toFixed(
        4
      )}, Lng ${pos.coords.longitude.toFixed(4)}`;

      if (window.confirm(`Use this location?\n${loc}`)) {
        setLocation(loc);
      }
    });
  };

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="containr">

      {/* FIRST NAME */}
      <div className="d-flex gap-2">
        <label>First Name</label>
        <input
          disabled={!editing}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="ee"
        />
      </div>

      {/* LAST NAME */}
      <div className="d-flex gap-2">
        <label>Last Name</label>
        <input disabled value={profile.lastName} className="ee"/>

      </div>

      {/* EMAIL */}
      <div className="d-flex gap-2">
        <label>Email</label>
        <input disabled value={profile.email} className="ee"/>
      </div>

      {/* LOCATION */}
      <div className="d-flex gap-2">
        <label>Location</label>
        <input
          disabled={!editing}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="ee"
        />
        <button onClick={useCurrentLocation} className="gr"><TbCurrentLocation /></button>
      </div>

      {error && <p >{error}</p>}

      {!editing ? (
        <button onClick={() => setEditing(true)} className="yu"><FaRegEdit /> Edit</button>
      ) : (
        <button onClick={saveProfile} className="yu">Save</button>
      )}
    </div>
  );
}


