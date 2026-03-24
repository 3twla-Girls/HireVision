import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (savedUser) {
      setUserData(JSON.parse(savedUser));
    }
    setLoading(false); 
  }, []);

  const login = (user) => {
    sessionStorage.setItem("user", JSON.stringify(user));
    setUserData(user);
  };

  const logout = () => {
    sessionStorage.removeItem("user");
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ userData, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);