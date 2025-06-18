import React, { useEffect, useState } from 'react';
import api from '../api';
import Header from '../components/Header';
import { useNavigate, Link } from 'react-router-dom';

type Transaction = {
  id: string;
  date: string;
  movieTitle: string;
  seat: string;
  amount: number;
  addOns?: { name: string; quantity: number; price: number }[];
};

const History: React.FC = () => {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/transactions')
      .then(res => {
        setHistory(res.data);
        setLoading(false);
      })
      .catch(() => {
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
    <>
      <Header />
      <div className="container">
        <h2 className="text-xl font-bold mb-4">Riwayat Pembelian</h2>
        {history.length === 0 ? (
          <div className="text-[var(--text-secondary)]">No transactions found.</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, txs]) => (
              <div key={date} className="border-b border-gray-700 pb-2 mb-2">
                <div className="font-bold mb-2 text-[var(--text-primary)] text-lg">{date}</div>
                <ul className="space-y-2">
                  {txs.map(tx => (
                    <li key={tx.id} className="rounded-lg overflow-hidden">
                      <Link to={`/payment-success?bookingId=${tx.id}`} className="history-item block hover:bg-[var(--accent)] hover:bg-opacity-10 transition-colors duration-200 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span role="img" aria-label="calendar">📅</span> <span className="font-semibold">{tx.movieTitle}</span>
                          </div>
                          <div className="text-xs text-[var(--text-secondary)]">{new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">Seat: {tx.seat} | Amount: <span className="text-[var(--success)] font-bold">Rp{tx.amount}</span></div>
                        {tx.addOns && tx.addOns.length > 0 && (
                          <div className="text-xs text-[var(--text-secondary)] mt-1">
                            Add-ons: {tx.addOns.map(a => `${a.name} x${a.quantity} (Rp${a.price * a.quantity})`).join(', ')}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <button 
          className="btn btn-secondary w-full mt-6" 
          onClick={() => navigate('/')}
        >
          Kembali ke Home
        </button>
      </div>
    </>
  );
};

export default History; 