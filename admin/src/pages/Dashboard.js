import React, { useState, useEffect } from 'react';
import {
  TicketIcon,
  CurrencyDollarIcon,
  FilmIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { authFetch, formatRupiah } from '../utils/authFetch';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, BarChart, Bar
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-xs uppercase text-gray-500">{label}</span>
            <span className="font-bold text-gray-900">{formatRupiah(payload[0].value)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

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
  ]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [filmDistribution, setFilmDistribution] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await authFetch('/api/admin');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const data = await response.json();
        setStats([
          {
            name: 'Total Tickets Sold',
            value: data.allTimeStats?.totalTickets?.toString() || '0',
            icon: TicketIcon,
            change: '+0%',
            changeType: 'positive',
          },
          {
            name: 'Total Revenue',
            value: formatRupiah(data.allTimeStats?.totalRevenue || 0),
            icon: CurrencyDollarIcon,
            change: '+0%',
            changeType: 'positive',
          },
          {
            name: 'Active Movies',
            value: data.allTimeStats?.activeMovies?.toString() || '0',
            icon: FilmIcon,
            change: '+0%',
            changeType: 'positive',
          },
        ]);
        setRecentBookings(data.recentBookings || []);
        setSalesTrend(data.salesTrend || []);
        setFilmDistribution(data.filmDistribution || []);
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
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((item) => (
            <div
              key={item.name}
              className="transform overflow-hidden rounded-xl bg-white bg-gradient-to-br from-white to-gray-50 shadow-lg transition-transform hover:scale-105"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col space-y-2">
                    <p className="text-md font-medium text-gray-500">{item.name}</p>
                    <p className="text-4xl font-bold text-gray-900">{item.value}</p>
                  </div>
                  <div className="rounded-full bg-primary-100 p-4">
                    <item.icon className="h-8 w-8 text-primary-600" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Sales Chart */}
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900">Sales Overview</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `Rp${value/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Movie Distribution Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900">Movie Distribution</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filmDistribution}
                  dataKey="ticketsSold"
                  nameKey="movieTitle"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  label={({ cx, cy, midAngle, outerRadius, percent, index }) => {
                    if (percent === 0) return null;
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 20; // Position label outside
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const color = CHART_COLORS[index % CHART_COLORS.length];

                    return (
                      <text x={x} y={y} fill={color} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontWeight="bold">
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {filmDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="mt-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Booking ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Movie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Showtime</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Seats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No recent bookings found
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((booking) => (
                    <tr key={booking.bookingId} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{booking.bookingId}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{booking.movieTitle}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{booking.showtime ? new Date(booking.showtime).toLocaleString() : ''}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{booking.seats}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{formatRupiah(booking.amount)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 