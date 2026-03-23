import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../context/AuthTypes'

interface RequireRoleProps {
  allowedRoles: Role[]
}

export default function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user } = useAuth()

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}
