import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TicketIcon, CalendarIcon, CurrencyDollarIcon, InformationCircleIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import api from '../api';

type Transaction = {
  id: string;
  date: string;
  movieTitle: string;
  posterUrl?: string;
  showtime: string;
  seat: string;
  amount: number;
  status: string;
};

const History: React.FC = () => {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/bookings/history')
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
      const response = await api.get(`/bookings/${bookingId}/ticket`, { responseType: 'blob' });
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
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl font-bold mb-4 sm:mb-0">Booking History</h1>
          <div className="flex gap-2">
            <select className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg text-sm focus:ring-yellow-500 focus:border-yellow-500">
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg text-sm focus:ring-yellow-500 focus:border-yellow-500">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-gray-800 rounded-lg">
            <TicketIcon className="mx-auto h-12 w-12 text-gray-600" />
            <h2 className="mt-4 text-xl font-semibold">No booking history found.</h2>
            <p className="mt-1 text-sm">Your booked tickets will appear here.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, transactions]) => (
            <div key={date} className="mb-8">
              <h2 className="text-yellow-500 text-lg font-semibold mb-4 pl-1">{date}</h2>
              <div className="space-y-6">
                {transactions.map(tx => (
                  <div key={tx.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-yellow-500/10 border border-gray-700/50">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-32 md:w-40 flex-shrink-0">
                        <img 
                          className="w-full h-full object-cover" 
                          src={tx.posterUrl} 
                          alt={tx.movieTitle} 
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x300/1a202c/4a5568?text=Poster' }}
                        />
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-semibold text-white">{tx.movieTitle}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider ${
                            tx.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                            tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-gray-300 text-sm mb-auto">
                          <div className="flex items-center gap-2">
                            <InformationCircleIcon className="w-5 h-5 text-gray-500" />
                            <span>Booking ID: <span className="font-mono">{tx.id}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TicketIcon className="w-5 h-5 text-gray-500" />
                            <span>Seats: <span className="font-semibold">{tx.seat}</span></span>
                          </div>
                          <div className="flex items-center gap-2 md:col-span-2">
                            <CalendarIcon className="w-5 h-5 text-gray-500" />
                            <span>Showtime: {new Date(tx.showtime).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}</span>
                          </div>
                           <div className="flex items-center gap-2">
                            <CurrencyDollarIcon className="w-5 h-5 text-gray-500" />
                            <span>Total: <span className="font-semibold">Rp{tx.amount.toLocaleString()}</span></span>
                          </div>
                        </div>

                        {tx.status === 'confirmed' && (
                          <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-700/50">
                            <button
                              onClick={() => navigate(`/payment-success?bookingId=${tx.id}`)}
                              className="flex items-center gap-2 bg-transparent border border-gray-600 text-gray-300 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors"
                            >
                              <EyeIcon className="w-4 h-4" />
                              View Ticket
                            </button>
                            <button
                              onClick={() => handleDownloadTicket(tx.id)}
                              className="flex items-center gap-2 bg-yellow-500 text-black px-5 py-2 rounded-lg text-sm font-medium hover:bg-yellow-400 transition-colors"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                              Download Ticket
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History; 