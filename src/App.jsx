import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import Dashboard from './pages/DashBoard/Dashboard'
import CriarConta from './pages/CriarConta/CriarConta'
import CadastrarAgente from './pages/CadastrarAgente/CadastrarAgente'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState('')

  const handleLogin = (username) => {
    setIsAuthenticated(true)
    setCurrentUser(username)
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
              <Dashboard username={currentUser} onLogout={handleLogout} /> : 
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
        
      </Routes>

      
    </BrowserRouter>
  )
}

export default App