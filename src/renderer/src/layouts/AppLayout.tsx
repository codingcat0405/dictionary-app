import React from 'react'
import Header from '@renderer/components/Header'
import { Route, Routes, Navigate } from 'react-router-dom'
import DictionaryPage from '@renderer/pages/DictionaryPage'
import AdminPage from '@renderer/pages/admin/AdminPage'
import Footer from '@renderer/components/Footer'
import LoginPage from '@renderer/pages/LoginPage'
import ExercisePage from '@renderer/pages/ExercisePage'
import RegisterPage from '@renderer/pages/RegisterPage'
import AdvanceDictionaryPage from '@renderer/pages/AdvanceDictionaryPage'
import ServerProtectedRoute from '@renderer/components/ServerProtectedRoute'

const AppLayout: React.FC = () => {
  return (
    <div>
      <Header />
      <main
        style={{
          minHeight: 'calc(100vh - 132px)',
          marginBottom: '20px'
        }}
      >
        <Routes>
          <Route path="/" element={<DictionaryPage />} />
          <Route
            path="/login"
            element={
              <ServerProtectedRoute>
                <LoginPage />
              </ServerProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ServerProtectedRoute>
                <RegisterPage />
              </ServerProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ServerProtectedRoute>
                <AdminPage />
              </ServerProtectedRoute>
            }
          />
          <Route
            path="/exercise"
            element={
              <ServerProtectedRoute>
                <ExercisePage />
              </ServerProtectedRoute>
            }
          />
          <Route
            path="/advanced-dictionary"
            element={
              <ServerProtectedRoute>
                <AdvanceDictionaryPage />
              </ServerProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
export default AppLayout
