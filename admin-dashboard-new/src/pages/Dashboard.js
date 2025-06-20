import React, { useState, useEffect } from 'react';
import {
  TicketIcon,
  CurrencyDollarIcon,
  FilmIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { authFetch } from '../utils/authFetch';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([
    {
      name: 'Total Tickets Sold',
      value: '0',
      icon: TicketIcon,
      change: '+0%',
      changeType: 'positive',
    },
    {
      name: 'Total Revenue',
      value: '$0.00',
      icon: CurrencyDollarIcon,
      change: '+0%',
      changeType: 'positive',
    },
    {
      name: 'Active Movies',
      value: '0',
      icon: FilmIcon,
      change: '+0%',
      changeType: 'positive',
    },
    {
      name: 'Total Bookings',
      value: '0',
      icon: UserGroupIcon,
      change: '+0%',
      changeType: 'positive',
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await authFetch('/api/admin/dashboard');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const data = await response.json();
        setStats([
          {
            name: 'Total Tickets Sold',
            value: data.todayStats?.totalTickets?.toString() || '0',
            icon: TicketIcon,
            change: '+0%',
            changeType: 'positive',
          },
          {
            name: 'Total Revenue',
            value: data.todayStats?.totalRevenue ? `$${data.todayStats.totalRevenue}` : '$0.00',
            icon: CurrencyDollarIcon,
            change: '+0%',
            changeType: 'positive',
          },
          {
            name: 'Active Movies',
            value: data.filmDistribution?.length?.toString() || '0',
            icon: FilmIcon,
            change: '+0%',
            changeType: 'positive',
          },
          {
            name: 'Total Bookings',
            value: data.todayStats?.totalTickets?.toString() || '0',
            icon: UserGroupIcon,
            change: '+0%',
            changeType: 'positive',
          },
        ]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-500 text-lg">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.name}
              className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
            >
              <dt>
                <div className="absolute rounded-md bg-primary-500 p-3">
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
              </dt>
              <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                <p
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    item.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {item.change}
                </p>
              </dd>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Sales Chart */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900">Sales Overview</h2>
          <div className="mt-4 h-80">
            {/* TODO: Add sales chart component */}
            <div className="flex h-full items-center justify-center text-gray-500">
              Sales chart will be displayed here
            </div>
          </div>
        </div>

        {/* Movie Distribution Chart */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900">Movie Distribution</h2>
          <div className="mt-4 h-80">
            {/* TODO: Add movie distribution chart component */}
            <div className="flex h-full items-center justify-center text-gray-500">
              Movie distribution chart will be displayed here
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="mt-8">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900">Recent Bookings</h2>
          <div className="mt-4">
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Booking ID</th>
                    <th className="table-header-cell">Movie</th>
                    <th className="table-header-cell">Showtime</th>
                    <th className="table-header-cell">Seats</th>
                    <th className="table-header-cell">Amount</th>
                    <th className="table-header-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  <tr className="table-row">
                    <td className="table-cell" colSpan="6">
                      <div className="text-center text-gray-500 py-4">
                        No recent bookings found
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 