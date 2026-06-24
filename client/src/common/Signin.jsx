import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/UserCon.jsx";

function Signin() {
  const { setcurr } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState({ email: "", password: "" });

  const handleclick = () => {
    navigate("/signup");
  };

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.detail);
        return;
      }
      localStorage.setItem("userData", JSON.stringify({
  user_id: result.user_id,
  firstName: result.firstName,
  lastName: result.lastName,
  email: result.email
}));
      setcurr({
        user_id: result.user_id,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email
      });
      navigate("/");

    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-center ">Sign In</h2>
      <div className="form-row">
    <label htmlFor="email">Email</label>
    <input
      id="email"
      name="email"
      type="email"
      onChange={handleChange}
      required
    />
  </div>

  <div className="form-row">
    <label htmlFor="password">Password</label>
    <input
      id="password"
      name="password"
      type="password"
      onChange={handleChange}
      required
    />
  </div>
      <button type="button" className="link-btn" onClick={handleclick}>
        Create Account
      </button>
      <button type="submit" className="primary-btn">Sign In</button>
    </form>
  );
}

export default Signin;
