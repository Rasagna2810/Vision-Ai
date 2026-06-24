import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/UserCon.jsx";

function Signup() {
  const { setcurr } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });

  const handleChange = (e) =>
    setData({ ...data, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();
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

    if (!res.ok) {
      alert(result.detail);
      return;
    }

    // setcurr(result);
    // localStorage.setItem("userData", JSON.stringify(result));
    navigate("/");
  };

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
   <h2 className="text-center ">Sign Up</h2>
  <div className="form-row">
    <label htmlFor="firstName">First Name</label>
    <input
      id="firstName"
      name="firstName"
      onChange={handleChange}
      required
    />
  </div>

  <div className="form-row">
    <label htmlFor="lastName">Last Name</label>
    <input
      id="lastName"
      name="lastName"
      onChange={handleChange}
      required
    />
  </div>

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


  <button
    type="button"
    className="link-btn"
    onClick={() => navigate("/signin")}
  >
    Already have an account? Sign In
  </button>
  <button type="submit" className="primary-btn">
    Sign Up
  </button>

</form>

  );
}

export default Signup;
