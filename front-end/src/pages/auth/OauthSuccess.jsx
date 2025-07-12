import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { message } from "antd";
import { getMe } from "../../services/api.js";

const OauthSuccess = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("accessToken");
    const error = urlParams.get("error");

    if (error) {
      message.error(decodeURIComponent(error));
      navigate("/login");
      return;
    }

    if (token) {
      localStorage.setItem("token", token);

      getMe()
        .then((data) => {
          if (data.user) {
            setUser(data.user); 
            if (data.user.role === "admin") navigate("/admin");
            else if (data.user.role === "barber") navigate("/barber");
            else navigate("/");
          } else {
            message.error("Failed to fetch user data");
            navigate("/login");
          }
        })
        .catch((err) => {
          console.error("Error fetching user data:", err);
          message.error("Login failed");
          navigate("/login");
        });
    } else {
      message.error("No access token received");
      navigate("/login");
    }
  }, [navigate, setUser]);

  return null;
};

export default OauthSuccess;