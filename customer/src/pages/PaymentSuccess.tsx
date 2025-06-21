import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../api';
import QRCode from 'qrcode';

interface Booking {
  bookingId: string;
  movieTitle: string;
  posterUrl?: string;
  showtime: {
    showDateTime: string;
    studioName?: string;
  } | null;
  seats: string[];
  totalAmount: number;
  status: string;
}

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const bookingId = params.get('bookingId');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError("No booking ID found.");
      setLoading(false);
      return;
    }
    setLoading(true);

    const fetchBookingData = async () => {
      try {
        const bookingRes = await api.get(`/booking/${bookingId}`);
        const bookingData = bookingRes.data;

        setBooking(bookingData);

        // Generate QR code
        const qrCodeData = await QRCode.toDataURL(JSON.stringify({
          bookingId: bookingData.bookingId,
          seats: bookingData.seats.join(', '),
          showtime: bookingData.showtime?.showDateTime,
          studio: bookingData.showtime?.studioName || 'N/A'
        }));
        setQrCode(qrCodeData);

      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingData();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="animate-pulse w-full max-w-md">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
            <div className="h-8 bg-gray-700 w-3/4 mx-auto rounded"></div>
            <div className="h-4 bg-gray-700 w-1/2 mx-auto rounded"></div>
            <div className="aspect-square bg-gray-700 w-48 h-48 mx-auto rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-700 w-full rounded"></div>
              <div className="h-6 bg-gray-700 w-2/3 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error || 'Booking not found.'}</p>
          <Link to="/" className="w-full bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-400 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-400 mb-2">Payment Successful!</h1>
          <p className="text-gray-400">Your ticket is ready. Thank you for your purchase!</p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-2xl relative overflow-hidden">
          {/* Perforated edge effect */}
          <div className="absolute top-0 left-1/2 -ml-3 w-6 h-6 bg-gray-900 rounded-full transform -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-1/2 -ml-3 w-6 h-6 bg-gray-900 rounded-full transform translate-y-1/2"></div>

          <div className="p-8">
            <div className="flex items-center gap-6 mb-6">
              {booking.posterUrl && (
                <div className="w-24 flex-shrink-0">
                  <img src={booking.posterUrl} alt={booking.movieTitle} className="rounded-lg shadow-md" />
                </div>
              )}
              <div className="flex-grow">
                <h2 className="text-2xl font-bold text-white">{booking.movieTitle}</h2>
                <p className="text-sm text-gray-400">{booking.showtime?.studioName || 'Studio 1'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6 text-sm">
              <div>
                <p className="text-gray-400">Date & Time</p>
                <p className="text-white font-medium">
                  {booking.showtime ? new Date(booking.showtime.showDateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                </p>
                <p className="text-white font-medium">
                  {booking.showtime ? new Date(booking.showtime.showDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Seats</p>
                <p className="text-white font-medium text-lg">{booking.seats.join(', ')}</p>
              </div>
              <div>
                <p className="text-gray-400">Total Amount</p>
                <p className="text-white font-medium">Rp{booking.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Status</p>
                <p className="text-green-400 font-medium capitalize">{booking.status}</p>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-600 pt-6 flex flex-col items-center">
              {qrCode && (
                <img src={qrCode} alt="QR Code" className="w-40 h-40 rounded-lg mb-4" />
              )}
              <p className="text-xs text-gray-500 text-center">Scan this QR code at the cinema entrance</p>
              <p className="text-xs text-gray-500 text-center mt-1">Booking ID: {booking.bookingId}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link 
            to="/" 
            className="w-full text-center bg-yellow-500 text-black px-4 py-3 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
          >
            Back to Home
          </Link>
          <Link 
            to="/history" 
            className="w-full text-center bg-gray-700 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            View Booking History
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 