import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Logo from './Logo';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-gray-900 shadow-lg">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>
        <div className="flex items-center space-x-8">
          {user && <Link to="/history" className="text-gray-200 hover:text-yellow-400 transition">History</Link>}
          {!user ? (
            <>
              <Link to="/login" className="text-gray-200 hover:text-yellow-400 transition">Login</Link>
              <Link to="/register" className="text-gray-200 hover:text-yellow-400 transition">Register</Link>
            </>
          ) : (
            <>
              <span className="text-gray-200">Hi, <span className="font-semibold">{user.username}</span></span>
              <button
                onClick={handleLogout}
                className="bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded hover:bg-yellow-300 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header; 