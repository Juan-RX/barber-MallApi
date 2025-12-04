import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import AgendarCita from './pages/AgendarCita';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { authService } from './services/auth.service';
import './App.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <img
            src="/logo.png"
            alt="Logo Barbería"
            className="header-logo"
          />
          <h1>Barbería VanDaik</h1>
        </div>
        <nav className="nav">
          <button 
            className="btn-iniciar-sesion"
            onClick={() => navigate('/login')}
          >
            Iniciar Sesión
          </button>
        </nav>
      </header>

      <main className="main">
        <div className="content-container">
          <div className="image-section">
            <div className="barberia-image">
              <img 
                src="/van.png" 
                alt="Logo VanDaik Barbería" 
                className="logo-image"
              />
            </div>
          </div>
          
          <div className="welcome-section">
            <div className="welcome-box">
              <h2>Bienvenida a nuestra Barbería</h2>
              <button 
                className="btn-registrar"
                onClick={() => navigate('/agendar-cita')}
              >
                Agendar Cita
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2024 Barbería. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

// Componente para proteger rutas que requieren autenticación
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  
  if (!authService.isAuthenticated()) {
    navigate('/login');
    return null;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/agendar-cita" element={<AgendarCita />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
