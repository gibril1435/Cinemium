import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import CinemaManagement from './pages/CinemaManagement';
import Notifications from './pages/Notifications';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-[var(--primary)] text-white">
          <div className="p-4">
            <h1 className="text-2xl font-bold">Cinemium Admin</h1>
          </div>
          <nav className="mt-4">
            <Link to="/dashboard" className="block px-4 py-2 hover:bg-[var(--accent)]">
              Home
            </Link>
            <Link to="/sales" className="block px-4 py-2 hover:bg-[var(--accent)]">
              Sales
            </Link>
            <Link to="/cinema-management" className="block px-4 py-2 hover:bg-[var(--accent)]">
              Cinema Management
            </Link>
            <Link to="/notifications" className="block px-4 py-2 hover:bg-[var(--accent)]">
              Notifications
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/cinema-management" element={<CinemaManagement />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
