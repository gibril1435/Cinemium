import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import CinemaManagement from './pages/CinemaManagement';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Movies from './pages/Movies';
import Showtimes from './pages/Showtimes';
import Bookings from './pages/Bookings';
import Addons from './pages/Addons';
import LoadingModal from './components/LoadingModal';

function checkAuth() {
  return !!localStorage.getItem('token');
}

const AppContent: React.FC<{ isAuthenticated: boolean; setIsAuthenticated: (auth: boolean) => void }> = ({
  isAuthenticated,
  setIsAuthenticated,
}) => {
  const location = useLocation();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const previousPathnameRef = useRef(location.pathname);

  useEffect(() => {
    if (previousPathnameRef.current !== location.pathname) {
      setIsPageLoading(true);
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 2000);
      previousPathnameRef.current = location.pathname;
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <>
      <LoadingModal isOpen={isPageLoading} message="Loading page..." />
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <Sidebar />
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            {isAuthenticated ? (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/showtimes" element={<Showtimes />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/addons" element={<Addons />} />
                <Route path="/" element={<Dashboard />} />
              </>
            ) : (
              <Route path="*" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            )}
          </Routes>
        </div>
      </div>
    </>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth());

  return (
    <Router>
      <AppContent isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
    </Router>
  );
};

export default App;
