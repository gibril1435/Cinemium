import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';

interface Booking {
  id: string;
  movieTitle: string;
  showtime: string;
  seats: string[];
  studio?: string;
  qrCodeUrl?: string;
  ticketPdfUrl?: string;
}

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const bookingId = params.get('bookingId');
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    api.get(`/booking/${bookingId}`)
      .then(res => {
        setBooking(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load booking details');
        setLoading(false);
      });
  }, [bookingId]);

  if (loading) return <div className="container p-4">Loading booking details...</div>;
  if (error) return <div className="container p-4 text-[var(--error)]">{error}</div>;
  if (!booking) return <div className="container p-4">Booking not found.</div>;

  return (
    <>
      <Header />
      <div className="container">
        <div className="payment-card">
          <h2 className="payment-success">Tiket Anda Berhasil Dibuat!</h2>
          <div className="bg-[var(--secondary)] rounded-lg p-4 mb-4">
            <div className="mb-2 font-semibold">Judul Film: {booking.movieTitle}</div>
            <div className="mb-2 text-[var(--text-secondary)]">Tanggal: {new Date(booking.showtime).toLocaleDateString()}</div>
            <div className="mb-2 text-[var(--text-secondary)]">Jam Tayang: {new Date(booking.showtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="mb-2 text-[var(--text-secondary)]">Studio: {booking.studio || '1'}</div>
            <div className="mb-2 text-[var(--text-secondary)]">Kursi: {booking.seats.join(', ')}</div>
            {booking.qrCodeUrl && (
              <div className="my-4 flex flex-col items-center">
                <img src={booking.qrCodeUrl} alt="QR Code" className="w-40 h-40 mx-auto" />
                <div className="text-xs text-[var(--text-secondary)] text-center">[QR Code Tiket]</div>
              </div>
            )}
          </div>
          {booking.ticketPdfUrl && (
            <a
              href={booking.ticketPdfUrl}
              className="btn btn-primary w-full"
              download
            >
              Download PDF
            </a>
          )}
          <button 
            className="btn btn-secondary w-full mt-4" 
            onClick={() => navigate('/')}
          >
            Kembali ke Home
          </button>
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess; 