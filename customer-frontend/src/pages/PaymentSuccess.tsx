import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../api';

interface Booking {
  id: string;
  movieTitle: string;
  showtime: {
    showDateTime: string;
  } | null;
  seats: string[];
  studio?: string;
  qrCodeUrl?: string;
  ticketPdfUrl?: string;
  totalAmount: number;
  status: string;
}

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const bookingId = params.get('bookingId');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    api.get(`/booking/${bookingId}`)
      .then(res => {
        console.log('Booking details response:', res.data);
        setBooking(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking details');
        setLoading(false);
      });
  }, [bookingId]);

  if (loading) return <div className="container p-4">Loading booking details...</div>;
  if (error) return <div className="container p-4 text-[var(--error)]">{error}</div>;
  if (!booking) return <div className="container p-4">Booking not found.</div>;

  return (
    <div className="container p-4">
      <div className="payment-success">✅ Pembayaran Berhasil!</div>
      {booking && (
        <div className="payment-card">
          <h3 className="text-xl font-bold mb-4">Detail Booking</h3>
          <div className="space-y-2">
            <div><strong>Booking ID:</strong> {booking.id}</div>
            <div><strong>Movie:</strong> {booking.movieTitle}</div>
            <div><strong>Showtime:</strong> {booking.showtime ? new Date(booking.showtime.showDateTime).toLocaleString() : 'N/A'}</div>
            <div><strong>Seats:</strong> {booking.seats.join(', ')}</div>
            <div><strong>Total Amount:</strong> Rp{booking.totalAmount}</div>
            <div><strong>Status:</strong> <span className="text-[var(--success)]">{booking.status}</span></div>
          </div>
        </div>
      )}
      <div className="text-center">
        <Link to="/" className="btn btn-primary">Kembali ke Beranda</Link>
      </div>
    </div>
  );
};

export default PaymentSuccess; 