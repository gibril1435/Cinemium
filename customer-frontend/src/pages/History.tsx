import React, { useEffect, useState } from 'react';
import api from '../api';

type Transaction = {
  id: string;
  date: string;
  movieTitle: string;
  seat: string;
  amount: number;
  status: string;
  addOns?: { name: string; quantity: number; price: number }[];
};

const History: React.FC = () => {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/booking/history')
      .then(res => {
        console.log('History API response:', res.data);
        setHistory(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching history:', err);
        setError('Failed to load history');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="container p-4">Loading history...</div>;
  if (error) return <div className="container p-4 text-[var(--error)]">{error}</div>;

  // Group transactions by date
  const grouped = history.reduce((acc, tx) => {
    const date = new Date(tx.date).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="container p-4">
      <h1 className="text-2xl font-bold mb-6">Riwayat Booking</h1>
      {history.length === 0 && !loading && (
        <div className="text-center text-[var(--text-secondary)]">
          Belum ada riwayat booking.
        </div>
      )}
      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date} className="border-b border-gray-700 pb-2 mb-2">
          <div className="font-bold mb-2 text-[var(--text-primary)] text-lg">{date}</div>
          <ul className="space-y-2">
            {txs.map(tx => (
              <li key={tx.id} className="rounded-lg overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{tx.movieTitle}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    tx.status === 'confirmed' ? 'bg-[var(--success)]' : 
                    tx.status === 'pending' ? 'bg-[var(--warning)]' : 'bg-[var(--error)]'
                  }`}>
                    {tx.status}
                  </span>
                </div>
                <div className="text-sm text-[var(--text-secondary)] space-y-1">
                  <div>Booking ID: {tx.id}</div>
                  <div>Showtime: {new Date(tx.date).toLocaleString()}</div>
                  <div>Seats: {tx.seat}</div>
                  <div>Total Amount: Rp{tx.amount}</div>
                  <div>Booking Date: {new Date(tx.date).toLocaleString()}</div>
                </div>
                {tx.addOns && tx.addOns.length > 0 && (
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    Add-ons: {tx.addOns.map(a => `${a.name} x${a.quantity} (Rp${a.price * a.quantity})`).join(', ')}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default History; 