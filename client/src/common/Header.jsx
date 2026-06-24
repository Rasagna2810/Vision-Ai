import React, { use } from 'react'
import {Link,useNavigate} from 'react-router-dom'
import {useAuth} from '../../context/UserCon.jsx'
import { AiFillThunderbolt } from "react-icons/ai";
import { PiUserCircleLight } from "react-icons/pi";
import { useState, useRef, useEffect } from "react";
import { VscSettings } from "react-icons/vsc";
import { FiLogOut } from "react-icons/fi";

function Header() {
  const {curr, setcurr} = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    setcurr(null);
    localStorage.removeItem("userData");
    localStorage.clear();
    navigate("/signin");
  };
  useEffect(() => { }, [curr]);
    useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
   <div className='aa'>

  <nav >
    <div className='hh'>
    <div className='d-flex align-items-center gap-2 w-50'>
    <AiFillThunderbolt className=" fs-4" />
    <h5 className="">Vision Ai</h5></div>
    
    <div className='header'>
       {curr?.firstName ? 
    (<span className="welcome-message ">Hi {curr.firstName}!</span>): <p className="RR">bro </p>
     }
      <Link to="/" className="ab">Home</Link>

      {curr?.email && <Link to="/uploads"className=" ab">Upload</Link>}
      {curr?.email && <Link to="/Dashboard"className=" ab">Dashboard</Link>}
      {curr?.email ? (
        <div className="user-menu" ref={menuRef}>
  <PiUserCircleLight
    size={28}
    className="user-icon"
    onClick={() => setOpen(!open)}
  />
  

  {open && (
    <div className="dropdown d-flex flex-column " >
      <Link to="/settings" className='pb-2 ps-2 dd'> <VscSettings className='fs-4'/>Settings</Link>
      {/* <Link to="/notifications" className='pb-2 ps-2 dd'><IoMdNotifications className='fs-4'/> Notifications</Link>
      <Link to="/history"className='pb-2 ps-2 dd'></Link> */}
      <hr  className='m-0'/>
      <button className="nav-link-btn ms-2 pt-2 pb-4" onClick={handleLogout}>
        <FiLogOut /> Logout
      </button>
    </div>
  )}
</div>

      ) : (
        <Link to="/signin" className="ab">Signin</Link>
      )}
    </div></div>
  </nav>
</div>

  )
}

export default Header