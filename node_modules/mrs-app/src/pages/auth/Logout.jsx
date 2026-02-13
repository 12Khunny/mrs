import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/authProvider";


const Logout = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(false);
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  return <>{handleLogout()}</>;
};

export default Logout;