import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ role, children }) {
  const { user, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  if (!user || (role && user.role !== role)) {
    return <Navigate to="/" replace />
  }
  return children
}