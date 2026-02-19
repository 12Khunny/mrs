import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './page/auth/LoginPage'
import RequireAuth from './core/auth/RequireAuth'
import AppLayout from './core/layout/AppLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes — จะเพิ่มหน้าอื่น ๆ ต่อไปที่นี่ */}
        <Route path="/truckWeighing/Auto" element={
          <RequireAuth>
            <AppLayout>
              <h1>TruckWeighing Auto</h1>
            </AppLayout>
          </RequireAuth>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/truckWeighing/Auto" replace />} />
        <Route path="*" element={<Navigate to="/truckWeighing/Auto" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
