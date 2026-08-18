import { Navigate, Route, Routes } from 'react-router-dom'
import ExperiencePage from '@/pages/ExperiencePage'
import AdminPage from '@/admin/AdminPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ExperiencePage />} />
      <Route path="/admin/*" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
