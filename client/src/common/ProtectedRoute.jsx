import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/UserCon";

function ProtectedRoute({ children }) {
  const { curr } = useAuth();

  if (!curr.email) return <Navigate to="/signin" />;

  return children;
}

export default ProtectedRoute;
