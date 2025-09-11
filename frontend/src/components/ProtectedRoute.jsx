
import React from "react";
import { useAuth } from "../context/AuthContext"; // Assuming you've set up AuthContext
import { Navigate } from "react-router-dom"; // Use Navigate instead of Redirect

const ProtectedRoute = ({ component: Component, roles, ...rest }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Show loading until auth status is confirmed
  }

  if (!user) {
    return <Navigate to="/login" replace />; // Redirect to login if not authenticated
  }

  // Check if user has the correct role for this route
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />; // Redirect based on role
  }

  return <Component {...rest} />; // Render the protected component
};

export default ProtectedRoute;
