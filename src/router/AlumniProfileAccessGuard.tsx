import { Navigate, Outlet, useParams } from 'react-router-dom';
import { isAdminUserId } from '../utils/admin';
import { useAuthStore } from '../store/useAuthStore';

const resolveProfileUserId = (rawId?: string) => {
  if (!rawId) return undefined;

  const normalized = rawId.startsWith('alumni-')
    ? rawId.slice('alumni-'.length)
    : rawId;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? String(parsed) : undefined;
};

export const AlumniProfileAccessGuard = () => {
  const { id } = useParams();
  const loginUserId = useAuthStore((state) => state.user?.id);
  const profileUserId = resolveProfileUserId(id);

  if (profileUserId && isAdminUserId(profileUserId)) {
    return <Navigate to='/alumni' replace />;
  }

  if (profileUserId && loginUserId && profileUserId === String(loginUserId)) {
    return <Navigate to='/me' replace />;
  }

  return <Outlet />;
};
