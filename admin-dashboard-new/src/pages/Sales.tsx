import React, { useEffect, useState } from 'react';
import api from '../api';

type SalesData = {
  totalRevenue: number;
  ticketSales: number;
  addOnSales: number;
  transactions: {
    id: string;
    date: string;
    movieTitle: string;
    seats: string[];
    addOns: { name: string; quantity: number; price: number }[];
    totalAmount: number;
  }[];
};

const Sales: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchSalesData();
  }, [dateRange]);

  const fetchSalesData = async () => {
    try {
      const response = await api.get('/admin/sales', {
        params: dateRange
      });
      setSalesData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load sales data');
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading sales data...</div>;
  if (error) return <div className="p-4 text-[var(--error)]">{error}</div>;
  if (!salesData) return <div className="p-4">No sales data available</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Sales Dashboard</h1>
      
      {/* Date Range Filter */}
      <div className="mb-6 flex gap-4">
        <input
          type="date"
          value={dateRange.start}
          onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          className="input"
        />
        <input
          type="date"
          value={dateRange.end}
          onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          className="input"
        />
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-2xl text-[var(--success)]">Rp{salesData.totalRevenue}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Ticket Sales</h3>
          <p className="text-2xl text-[var(--primary)]">Rp{salesData.ticketSales}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Add-on Sales</h3>
          <p className="text-2xl text-[var(--accent)]">Rp{salesData.addOnSales}</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-bold p-4 border-b">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Movie</th>
                <th className="px-4 py-2 text-left">Seats</th>
                <th className="px-4 py-2 text-left">Add-ons</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {salesData.transactions.map(tx => (
                <tr key={tx.id} className="border-t">
                  <td className="px-4 py-2">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{tx.movieTitle}</td>
                  <td className="px-4 py-2">{tx.seats.join(', ')}</td>
                  <td className="px-4 py-2">
                    {tx.addOns.map(a => `${a.name} (${a.quantity})`).join(', ') || '-'}
                  </td>
                  <td className="px-4 py-2 text-right">Rp{tx.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales; 