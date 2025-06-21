import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import CinemaManagement from './pages/CinemaManagement';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Movies from './pages/Movies';
import Showtimes from './pages/Showtimes';
import Bookings from './pages/Bookings';
import Addons from './pages/Addons';

function checkAuth() {
  return !!localStorage.getItem('token');
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth());

  return (
    <Router>
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
    </Router>
  );
};

export default App;
