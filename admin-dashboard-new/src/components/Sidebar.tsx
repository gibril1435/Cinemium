import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ChartBarIcon,
  FilmIcon,
  CalendarIcon,
  TicketIcon,
  ShoppingCartIcon,
  ArrowLeftOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { authFetch } from '../utils/authFetch';

const isAuthenticated = () => !!localStorage.getItem('token');

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Sales', href: '/sales', icon: ChartBarIcon },
  { name: 'Movies', href: '/movies', icon: FilmIcon },
  { name: 'Showtimes', href: '/showtimes', icon: CalendarIcon },
  { name: 'Bookings', href: '/bookings', icon: TicketIcon },
  { name: 'Add-ons', href: '/addons', icon: ShoppingCartIcon },
];

interface User {
  username: string;
  email: string;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authFetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        handleLogout();
      }
    };

    if (isAuthenticated()) {
      fetchUser();
    }
  }, []);

  if (!isAuthenticated()) return null;

  return (
    <aside className="w-64 h-screen bg-gray-900 text-gray-200 flex flex-col sticky top-0 shadow-xl">
      <div className="flex items-center justify-center h-20 border-b border-gray-800">
        <Link to="/dashboard" className="text-3xl font-bold tracking-wider text-white hover:text-primary-400 transition-colors">
          <span className="text-primary-500">C</span>INEMIUM
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Menu</p>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || (location.pathname === '/' && item.href === '/dashboard');
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 group text-sm
                ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          {user ? (
            <>
              <UserCircleIcon className="h-10 w-10 text-gray-500" />
              <div className="overflow-hidden">
                <p className="font-semibold text-sm text-white truncate">{user.username}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-700 rounded w-24"></div>
                <div className="h-2 bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-gray-800 hover:bg-red-700 text-gray-300 hover:text-white font-semibold transition-colors duration-150"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 