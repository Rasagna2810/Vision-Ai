import React, { use } from 'react'
import { useState,useEffect} from 'react'
import { MdManageHistory } from "react-icons/md";
import { RiSettings4Line } from "react-icons/ri";
import { IoMdNotifications } from "react-icons/io";
import Notification from './Notification';
import Profile from './Profile';
import History from './History';

function Setting() {
  const [open, setOpen] = useState('Profile');

  useEffect(() => {
    localStorage.setItem('settingOpen', open);
  }, [open]);

  return (
    <div className='d-flex tt'>
        <div className='d-flex flex-column gap-4 p-3 setting-menu'>
          <button className="btn btn-light gg" onClick={() => setOpen('Profile')}><RiSettings4Line  className='fs-5'/> Profile</button>
          <button className="btn btn-light gg" onClick={() => setOpen('Notifications')}><IoMdNotifications className='fs-5'/> Notifications</button>
          <button className="btn btn-light gg" onClick={() => setOpen('History')}><MdManageHistory className='fs-5'/> History</button>
        </div>
        <div>
          {open === 'Profile' && <div className='p-4'><Profile/></div>}
          {open === 'Notifications' && <div className='p-4'><Notification/></div>}
          {open === 'History' && <div className='p-4'><History/></div>}
        </div>
    </div>
  )
}

export default Setting