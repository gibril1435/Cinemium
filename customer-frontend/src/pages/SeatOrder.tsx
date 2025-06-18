import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';

// Types
interface Seat {
  id: string;
  label: string;
  available: boolean;
}

const SeatOrder: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const movieId = params.get('movieId');
  const showtimeId = params.get('showtimeId');

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [movieTitle, setMovieTitle] = useState('');
  const [showtime, setShowtime] = useState('');

  const ROWS = 5;
  const COLS = 8;
  const ROW_LABELS = ['A', 'B', 'C', 'D', 'E'];
  const SEAT_PRICE = 50000; // mock price

  useEffect(() => {
    if (!showtimeId) return;
    setLoading(true);
    api.get(`/showtimes/${showtimeId}/seats`)
      .then(res => {
        setSeats(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load seat layout');
        setLoading(false);
      });
    // Fetch movie and showtime info
    if (movieId) {
      api.get(`/movies/${movieId}`).then(res => setMovieTitle(res.data.title));
    }
    if (showtimeId) {
      api.get(`/showtimes/${showtimeId}`).then(res => setShowtime(res.data.time));
    }
  }, [showtimeId, movieId]);

  const toggleSeat = (seatId: string) => {
    setSelectedSeats(seats => {
      if (seats.includes(seatId)) {
        return seats.filter(id => id !== seatId);
      } else if (seats.length < 4) {
        return [...seats, seatId];
      } else {
        return seats; // max 4 seats
      }
    });
  };

  const handlePay = async () => {
    if (!showtimeId || selectedSeats.length === 0) return;
    setPaying(true);
    try {
      const res = await api.post('/booking', {
        showtimeId,
        seatIds: selectedSeats,
      });
      navigate(`/payment-success?bookingId=${res.data.id}`);
    } catch {
      setError('Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="container p-4">Loading seats...</div>;
  if (error) return <div className="container p-4 text-[var(--error)]">{error}</div>;

  return (
    <>
      <Header />
      <div className="container">
        <h2 className="text-xl font-bold mb-2">Pilih Kursi - {movieTitle} - Jam: {showtime ? new Date(showtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</h2>
        <div className="mb-2 text-center font-mono text-[var(--text-secondary)]">LAYAR</div>
        <div className="flex flex-col items-center mb-2">
          {/* Column labels */}
          <div className="flex mb-1 ml-8">
            <div className="w-6" />
            {[...Array(COLS)].map((_, i) => (
              <div key={i} className="w-10 text-center font-bold">{i + 1}</div>
            ))}
          </div>
          {/* Seat grid */}
          {Array.from({ length: ROWS }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex items-center mb-1">
              <div className="w-6 text-center font-bold">{ROW_LABELS[rowIdx]}</div>
              {Array.from({ length: COLS }).map((_, colIdx) => {
                const seat = seats.find(s => s.label === `${ROW_LABELS[rowIdx]}${colIdx + 1}`);
                return seat ? (
                  <button
                    key={seat.id}
                    disabled={!seat.available}
                    onClick={() => toggleSeat(seat.id)}
                    className={`seat ${!seat.available ? 'seat-occupied' : selectedSeats.includes(seat.id) ? 'seat-selected' : 'seat-available'}`}
                  >
                    {colIdx + 1}
                  </button>
                ) : (
                  <div key={colIdx} className="w-10 h-10 m-0.5" />
                );
              })}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex gap-4 mb-4 text-sm">
          <div><span className="inline-block w-4 h-4 bg-[var(--accent)] mr-1 rounded align-middle" /> Dipilih</div>
          <div><span className="inline-block w-4 h-4 bg-gray-600 mr-1 rounded align-middle" /> Dipesan</div>
          <div><span className="inline-block w-4 h-4 bg-[var(--secondary)] border mr-1 rounded align-middle" /> Kosong</div>
        </div>
        {/* Summary */}
        <div className="payment-card">
          <div className="font-semibold">Pilihan Anda: {selectedSeats.map(id => seats.find(s => s.id === id)?.label).filter(Boolean).join(', ') || '-'}</div>
          <div>Total Harga: <span className="text-[var(--success)] font-bold">Rp{selectedSeats.length * SEAT_PRICE}</span></div>
        </div>
        <button
          className="btn btn-success w-full mt-4"
          onClick={handlePay}
          disabled={selectedSeats.length === 0 || paying}
        >
          {paying ? 'Processing...' : 'Bayar'}
        </button>
      </div>
    </>
  );
};

export default SeatOrder; 