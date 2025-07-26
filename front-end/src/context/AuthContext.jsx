import {createContext, useContext, useEffect, useState} from "react";
import {getMe, loginUser, logoutUser} from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchUser();
  }, []);

  // Lấy user từ API /auth/me (dựa vào cookie)
  const fetchUser = async () => {
    try {
      const res = await getMe();
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  const login = async (credentials) => {
    await loginUser(credentials);
    const res = await getMe();       // 👈 gọi trực tiếp luôn ở đây
    setUser(res.data.user);
    return res.data.user;            // 👈 trả lại user để LoginForm dùng
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error("Error logout:", err);
    }
  };

  return (
    <AuthContext.Provider value={{user, login, logout, loading}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
