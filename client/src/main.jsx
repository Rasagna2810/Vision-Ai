import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import { createBrowserRouter,RouterProvider,Navigate } from 'react-router-dom'
import React from 'react'
import ProtectedRoute from './common/ProtectedRoute.jsx'
import Dashboard from './common/Dashboard.jsx'
import Home from './common/Home.jsx'
import Signin from './common/Signin.jsx'
import Signup from './common/Signup.jsx'
import Uploads from './Uploads.jsx'
import Rootlayout from './Rootlayout.jsx'
import UserCon from '../context/UserCon.jsx'
import Setting from './common/Setting.jsx'
import './index.css'
import App from './App.jsx'
// import Dashboard from './common/Dashboard.jsx'

const browse=createBrowserRouter([{
  path:'/',
  element:<Rootlayout/>,
  children:[
    {path:'',element:  
        <Home />
      },
    {path:'/signin',element:<Signin/>},
    {path:'/signup',element:<Signup/>},
    {path:'/uploads',element: <Uploads/>
    // <ProtectedRoute><Uploads/></ProtectedRoute>
  },
     {path:'/Dashboard',element: <Dashboard/>
    //  <ProtectedRoute><Dashboard/></ProtectedRoute>
    },
  {path:'/settings',element: <Setting/>
    // <ProtectedRoute><Uploads/></ProtectedRoute>
  }
]}])

createRoot(document.getElementById('root')).render(
    <UserCon>
      <RouterProvider router={browse}/>
    </UserCon>
)
