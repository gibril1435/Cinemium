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
    <nav className="header">
      <div className="container flex justify-between items-center">
        <Link to="/" className="flex items-center"><Logo /></Link>
        <div className="flex space-x-4 items-center">
          {user && <Link to="/history" className="nav-link">History</Link>}
          {!user ? (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          ) : (
            <>
              <span className="text-[var(--text-secondary)] mr-2">Hi, {user.username}</span>
              <button className="nav-link" onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header; 