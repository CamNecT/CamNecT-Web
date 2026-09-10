import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const AdminGuard = () => {
  const role = useAuthStore((state) => state.user?.role);

  if (role !== 'ADMIN') {
    return <Navigate to='/home' replace />;
  }

  return <Outlet />;
};
