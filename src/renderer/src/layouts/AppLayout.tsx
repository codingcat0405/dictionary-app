import React from 'react'
import Header from '@renderer/components/Header'
import { Route, Routes, Navigate } from 'react-router-dom'
import DictionaryPage from '@renderer/pages/DictionaryPage'
import AdminLayout from '@renderer/layouts/AdminLayout'
import DashBoard from '@renderer/pages/admin/tabs/DashBoard'
import DictionaryAdmin from '@renderer/pages/admin/tabs/Dictionary'
import ExercisesAdmin from '@renderer/pages/admin/tabs/Execices'
import CurriculumAdmin from '@renderer/pages/admin/tabs/Curriculum'
import Footer from '@renderer/components/Footer'
import LoginPage from '@renderer/pages/LoginPage'
import ExercisePage from '@renderer/pages/ExercisePage'
import RegisterPage from '@renderer/pages/RegisterPage'
import AdvanceDictionaryPage from '@renderer/pages/AdvanceDictionaryPage'
import CurriculumPage from '@renderer/pages/CurriculumPage'
import ServerProtectedRoute from '@renderer/components/ServerProtectedRoute'
import RequireAdmin from '@renderer/components/require-admin'

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
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              </ServerProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashBoard />} />
            <Route path="dictionary" element={<DictionaryAdmin />} />
            <Route path="exercises" element={<ExercisesAdmin />} />
            <Route path="curriculum" element={<CurriculumAdmin />} />
          </Route>
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
          <Route
            path="/curriculum"
            element={
              <ServerProtectedRoute>
                <CurriculumPage />
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
