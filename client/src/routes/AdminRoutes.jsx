import { Navigate } from "react-router-dom";

import LoadingSpinner from "../components/Shared/LoadingSpinner";
import PropTypes from "prop-types";
import useRole from "../hooks/useRole";

const AdminRoutes = ({ children }) => {
  const [role, isLoading] = useRole();

  if (isLoading) return <LoadingSpinner />;
  if (role === "admin") return children;
  return <Navigate to="/dashboard" state={{ from: location }} replace="true" />;
};

AdminRoutes.propTypes = {
  children: PropTypes.element,
};

export default AdminRoutes;
