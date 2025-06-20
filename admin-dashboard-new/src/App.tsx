import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import CinemaManagement from './pages/CinemaManagement';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Movies from './pages/Movies';
import Showtimes from './pages/Showtimes';
import Studios from './pages/Studios';
import Bookings from './pages/Bookings';
import Addons from './pages/Addons';
import Pricing from './pages/Pricing';

const isAuthenticated = () => !!localStorage.getItem('token');

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <Sidebar />
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/login" element={<Login />} />
            {isAuthenticated() ? (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/showtimes" element={<Showtimes />} />
                <Route path="/studios" element={<Studios />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/addons" element={<Addons />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/" element={<Dashboard />} />
              </>
            ) : (
              <Route path="*" element={<Login />} />
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
