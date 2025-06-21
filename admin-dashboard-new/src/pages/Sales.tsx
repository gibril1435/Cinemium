import React, { useEffect, useState, useCallback } from 'react';
import { authFetch, formatRupiah } from '../utils/authFetch';
import { CurrencyDollarIcon, TicketIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { subDays, format } from 'date-fns';

type DailySale = {
  date: string;
  totalTickets: number;
  totalSales: number;
};

type SalesData = {
  totalSales: number;
  totalTickets: number;
  dailyData: DailySale[];
};

const Sales: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end
      }).toString();
      const response = await authFetch(`/api/admin/sales/weeks?${params}`);
      if (!response.ok) throw new Error('Failed to load sales data');
      const data = await response.json();
      setSalesData(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load sales data');
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const chartData = salesData?.dailyData.map(day => ({
    name: format(new Date(day.date), 'MMM d'),
    sales: day.totalSales,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Sales Dashboard</h1>
        <div className="mt-4 sm:mt-0 flex items-center gap-4">
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="input-field"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="input-field"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">{error}</div>
      ) : !salesData ? (
        <div className="text-center py-20 text-gray-500">No sales data available for the selected period.</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={CurrencyDollarIcon} title="Total Revenue" value={formatRupiah(salesData.totalSales)} />
            <StatCard icon={TicketIcon} title="Total Tickets Sold" value={salesData.totalTickets.toLocaleString()} />
            <StatCard icon={ChartBarIcon} title="Average Sale" value={formatRupiah(salesData.totalTickets > 0 ? salesData.totalSales / salesData.totalTickets : 0)} />
          </div>

          {/* Chart and Table */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3 card">
              <h2 className="text-xl font-semibold text-gray-900">Sales Trend</h2>
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatRupiah(value)}`} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }} />
                    <Legend />
                    <Bar dataKey="sales" fill="#6366f1" name="Daily Sales" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="lg:col-span-2 card">
              <h2 className="text-xl font-semibold text-gray-900">Daily Summary</h2>
              <div className="mt-4 overflow-y-auto h-80">
                <table className="min-w-full">
                  <thead className="sticky top-0 bg-white">
                    <tr>
                      <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                      <th className="py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Tickets</th>
                      <th className="py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salesData.dailyData.map(day => (
                      <tr key={day.date}>
                        <td className="py-3 text-sm text-gray-500">{format(new Date(day.date), 'MMM d, yyyy')}</td>
                        <td className="py-3 text-right text-sm text-gray-500">{day.totalTickets}</td>
                        <td className="py-3 text-right text-sm font-semibold text-gray-900">{formatRupiah(day.totalSales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string }> = ({ icon: Icon, title, value }) => (
  <div className="transform overflow-hidden rounded-xl bg-white bg-gradient-to-br from-white to-gray-50 shadow-lg transition-transform hover:scale-105">
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col space-y-2">
          <p className="text-md font-medium text-gray-500">{title}</p>
          <p className="text-4xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="rounded-full bg-primary-100 p-4">
          <Icon className="h-8 w-8 text-primary-600" aria-hidden="true" />
        </div>
      </div>
    </div>
  </div>
);

export default Sales; 