import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ChartBarIcon,
  FilmIcon,
  CalendarIcon,
  BuildingLibraryIcon,
  TicketIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  BellIcon,
  UserGroupIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

const isAuthenticated = () => !!localStorage.getItem('token');

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Sales', href: '/sales', icon: ChartBarIcon },
  { name: 'Movies', href: '/movies', icon: FilmIcon },
  { name: 'Showtimes', href: '/showtimes', icon: CalendarIcon },
  { name: 'Studios', href: '/studios', icon: BuildingLibraryIcon },
  { name: 'Bookings', href: '/bookings', icon: TicketIcon },
  { name: 'Add-ons', href: '/addons', icon: ShoppingCartIcon },
  { name: 'Pricing', href: '/pricing', icon: CurrencyDollarIcon },
  { name: 'Notifications', href: '/notifications', icon: BellIcon },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  if (!isAuthenticated()) return null;
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm sticky top-0">
      <div className="p-6 flex items-center border-b border-gray-100">
        <span className="text-2xl font-bold text-primary-700 tracking-tight">Cinemium Admin</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors duration-150 text-base group
                ${isActive ? 'bg-primary-100 text-primary-700 shadow' : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'}`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors duration-150 shadow"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 