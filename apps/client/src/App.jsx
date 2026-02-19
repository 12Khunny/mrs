import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import LoginPage from './page/LoginPage'
import RequireAuth from './core/auth/RequireAuth'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><h1>MRS</h1></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
