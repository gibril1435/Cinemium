import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Movies from './pages/Movies';
import Showtimes from './pages/Showtimes';
import Bookings from './pages/Bookings';
import Addons from './pages/Addons';
import Studios from './pages/Studios';
import Pricing from './pages/Pricing';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/showtimes" element={<Showtimes />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/addons" element={<Addons />} />
          <Route path="/studios" element={<Studios />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
