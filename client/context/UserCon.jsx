import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

function UserCon({ children }) {
  const [curr, setcurr] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("userData");
    if (user) {
      setcurr(JSON.parse(user));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ curr, setcurr }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};

export default UserCon;
