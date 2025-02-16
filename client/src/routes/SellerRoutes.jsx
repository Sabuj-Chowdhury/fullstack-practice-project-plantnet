import { Navigate } from "react-router-dom";

import LoadingSpinner from "../components/Shared/LoadingSpinner";
import PropTypes from "prop-types";
import useRole from "../hooks/useRole";

const SellerRoutes = ({ children }) => {
  const [role, isLoading] = useRole();

  if (isLoading) return <LoadingSpinner />;
  if (role === "seller") return children;
  return <Navigate to="/dashboard" state={{ from: location }} replace="true" />;
};

SellerRoutes.propTypes = {
  children: PropTypes.element,
};

export default SellerRoutes;
