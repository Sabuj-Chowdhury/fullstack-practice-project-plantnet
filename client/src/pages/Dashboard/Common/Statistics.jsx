import { Helmet } from "react-helmet-async";
import AdminStatistics from "../../../components/Dashboard/Statistics/AdminStatistics";
import useRole from "../../../hooks/useRole";
import { Navigate } from "react-router-dom";
const Statistics = () => {
  const [role, isLoading] = useRole();

  if (role === "customer") {
    return <Navigate to="/dashboard/my-orders"></Navigate>;
  }
  return (
    <div>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      <AdminStatistics />
    </div>
  );
};

export default Statistics;
