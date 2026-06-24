import React from 'react'
import Header from './common/Header'
import Footer from './common/Footer'
import { Outlet } from 'react-router-dom'


function Rootlayout() {

  return (
    <div>
      <Header />
           <div style={{minHeight:"48vh"}}>
            <Outlet/>
            </div>
      <Footer/>
    </div>
  )
}

export default Rootlayout