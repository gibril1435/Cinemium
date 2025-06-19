import React, { ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import History from './pages/History';
import MovieDetail from './pages/MovieDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import SeatOrder from './pages/SeatOrder';
import PaymentSuccess from './pages/PaymentSuccess';
import Header from './components/Header';
import { AuthProvider, useAuth } from './AuthContext';

const PrivateRoute = ({ children }: { children: ReactElement }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-4">Loading...</div>;
  if (!user) return <div className="p-4 text-red-500">You must be logged in to access this page.</div>;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/seat-order" element={<PrivateRoute><SeatOrder /></PrivateRoute>} />
          <Route path="/payment-success" element={<PrivateRoute><PaymentSuccess /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
