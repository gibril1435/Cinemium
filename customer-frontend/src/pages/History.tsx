import React, { useEffect, useState } from 'react';
import api from '../api';

type Transaction = {
  id: string;
  date: string;
  movieTitle: string;
  showtime: string;
  seat: string;
  amount: number;
  status: string;
};

const History: React.FC = () => {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/booking/history')
      .then(res => {
        setHistory(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching history:', err);
        setError('Failed to load booking history');
        setLoading(false);
      });
  }, []);

  const handleDownloadTicket = async (bookingId: string) => {
    try {
      const response = await api.get(`/booking/${bookingId}/ticket`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading ticket:', err);
      alert('Failed to download ticket');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Booking History</h1>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Booking History</h1>
        <div className="bg-red-900/50 border border-red-500 text-red-100 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  // Group transactions by date
  const grouped = history.reduce((acc, tx) => {
    const date = new Date(tx.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Booking History</h1>
        <div className="flex gap-2">
          <select className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No booking history found.
        </div>
      ) : (
        Object.entries(grouped).map(([date, transactions]) => (
          <div key={date} className="mb-8">
            <h2 className="text-yellow-500 text-lg font-semibold mb-4">{date}</h2>
            <div className="space-y-4">
              {transactions.map(tx => (
                <div key={tx.id} className="bg-gray-900 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{tx.movieTitle}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      tx.status === 'confirmed' ? 'bg-green-900 text-green-300 border border-green-700' :
                      tx.status === 'pending' ? 'bg-yellow-900 text-yellow-300 border border-yellow-700' :
                      'bg-red-900 text-red-300 border border-red-700'
                    }`}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-gray-300 mb-4">
                    <div>Booking ID: {tx.id}</div>
                    <div>Showtime: {new Date(tx.showtime).toLocaleString()}</div>
                    <div>Seats: {tx.seat}</div>
                    <div>Total: Rp{tx.amount.toLocaleString()}</div>
                  </div>

                  {tx.status === 'confirmed' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDownloadTicket(tx.id)}
                        className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
                      >
                        Download Ticket
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default History; 