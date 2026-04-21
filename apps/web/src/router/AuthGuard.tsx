import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  permission?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, permission }) => {
  const token = useAuthStore((s) => s.token);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
