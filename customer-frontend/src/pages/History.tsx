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
};

const History: React.FC = () => {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/history')
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
              <div key={date}>
                <div className="font-bold mb-2 text-[var(--text-primary)]">{date}</div>
                <ul className="space-y-2">
                  {txs.map(tx => (
                    <li key={tx.id}>
                      <Link to={`/payment-success?bookingId=${tx.id}`} className="history-item block hover:bg-[var(--accent)] hover:bg-opacity-10 transition-colors duration-200">
                        <span role="img" aria-label="calendar">📅</span> Tiket: {tx.movieTitle} - {new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                        <span className="block text-xs text-[var(--text-secondary)] mt-1">Seat: {tx.seat} | Amount: Rp{tx.amount}</span>
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