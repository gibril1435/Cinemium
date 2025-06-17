import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  TicketIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  totalRevenue: number;
  totalTickets: number;
  totalBookings: number;
  totalAddons: number;
  revenueByDay: Array<{ date: string; amount: number }>;
  topMovies: Array<{ title: string; tickets: number; revenue: number }>;
  topAddons: Array<{ name: string; quantity: number; revenue: number }>;
  hourlyDistribution: Array<{ hour: number; tickets: number }>;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await axios.get(`/api/admin/analytics?timeRange=${timeRange}`);
      // setData(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Overview of sales, bookings, and performance metrics.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {formatCurrency(data.totalRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TicketIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tickets Sold</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {formatNumber(data.totalTickets)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {formatNumber(data.totalBookings)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Add-ons Sold</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {formatNumber(data.totalAddons)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Movies */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Top Movies</h2>
        <div className="mt-4 bg-white shadow rounded-lg">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Movie</th>
                  <th className="table-header-cell">Tickets Sold</th>
                  <th className="table-header-cell">Revenue</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {data.topMovies.map((movie, index) => (
                  <tr key={index} className="table-row">
                    <td className="table-cell font-medium text-gray-900">{movie.title}</td>
                    <td className="table-cell">{formatNumber(movie.tickets)}</td>
                    <td className="table-cell">{formatCurrency(movie.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Add-ons */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Top Add-ons</h2>
        <div className="mt-4 bg-white shadow rounded-lg">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Add-on</th>
                  <th className="table-header-cell">Quantity Sold</th>
                  <th className="table-header-cell">Revenue</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {data.topAddons.map((addon, index) => (
                  <tr key={index} className="table-row">
                    <td className="table-cell font-medium text-gray-900">{addon.name}</td>
                    <td className="table-cell">{formatNumber(addon.quantity)}</td>
                    <td className="table-cell">{formatCurrency(addon.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hourly Distribution */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Hourly Distribution</h2>
        <div className="mt-4 bg-white shadow rounded-lg p-6">
          <div className="h-64">
            <div className="flex h-full items-end space-x-2">
              {data.hourlyDistribution.map((hour, index) => (
                <div key={index} className="flex-1">
                  <div
                    className="bg-primary-600 rounded-t"
                    style={{
                      height: `${(hour.tickets / Math.max(...data.hourlyDistribution.map((h) => h.tickets))) * 100}%`,
                    }}
                  />
                  <div className="text-xs text-center text-gray-500 mt-1">
                    {hour.hour}:00
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 