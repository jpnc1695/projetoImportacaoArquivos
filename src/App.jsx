import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import Dashboard from './pages/DashBoard/Dashboard'
import CriarConta from './pages/CriarConta/CriarConta'
import CadastrarAgente from './pages/CadastrarAgente/CadastrarAgente'
import Admin from './pages/Admin/Admin'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  const handleLogin = (user) => {
    setIsAuthenticated(true)
    setCurrentUser(user)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUser('')
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
              <Navigate to="/dashboard" /> : 
              <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? 
              <Dashboard username={currentUser.username} userId={currentUser.id} onLogout={handleLogout} /> : 
              <Navigate to="/" />
          } 
        />
         <Route 
          path="/registrar" 
          element={<CriarConta/>}        
        />

        <Route 
          path="/registrarAgente" 
          element={<CadastrarAgente/>}        
        />  

        <Route 
          path="/admin" 
          element={<Admin/>}        
        />          
      </Routes>      
    </BrowserRouter>
  )
}

export default App