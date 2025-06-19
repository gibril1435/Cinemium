import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

// Types
interface Seat {
  id: string;
  label: string;
  available: boolean;
}

interface AddOn {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
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
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<{ [id: number]: number }>({});
  const [notification, setNotification] = useState<string | null>(null);

  const ROWS = 5;
  const COLS = 8;
  const ROW_LABELS = ['A', 'B', 'C', 'D', 'E'];
  const SEAT_PRICE = 50000; // mock price

  useEffect(() => {
    if (!showtimeId) return;
    setLoading(true);
    api.get(`/booking/showtimes/${showtimeId}/seats`)
      .then(res => {
        console.log('Seat layout response:', res.data);
        setSeats(res.data.layout?.seats || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load seat layout');
        setLoading(false);
      });
    // Fetch movie and showtime info
    if (movieId) {
      api.get(`/movies/${movieId}`).then(res => {
        console.log('Movie detail response:', res.data);
        setMovieTitle(res.data.title);
      });
    }
    if (showtimeId) {
      api.get(`/booking/showtimes/${showtimeId}`).then(res => {
        console.log('Showtime detail response:', res.data);
        setShowtime(res.data.showDateTime || res.data.time);
      });
    }
    // Fetch add-ons
    api.get('/addons')
      .then(res => {
        console.log('Add-ons response:', res.data);
        setAddOns(res.data.addOns || res.data);
      })
      .catch(() => setAddOns([]));
  }, [showtimeId, movieId]);

  const toggleSeat = (seatId: string) => {
    setSelectedSeats(seats => {
      if (seats.includes(seatId)) {
        return seats.filter(id => id !== seatId);
      } else if (seats.length < 4) {
        return [...seats, seatId];
      } else {
        setNotification('Maximum 4 seats per transaction');
        setTimeout(() => setNotification(null), 3000);
        return seats;
      }
    });
  };

  const handleAddOnChange = (id: number, value: number) => {
    setSelectedAddOns(prev => ({ ...prev, [id]: value }));
  };

  const totalAddOnPrice = addOns.reduce((sum, addOn) => sum + (selectedAddOns[addOn.id] || 0) * addOn.price, 0);
  const totalPrice = selectedSeats.length * SEAT_PRICE + totalAddOnPrice;

  const handlePay = async () => {
    if (!showtimeId || selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }
    if (selectedSeats.length > 4) {
      setNotification('Maximum 4 seats per transaction');
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setPaying(true);
    try {
      const addOnsToSend = Object.entries(selectedAddOns)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({ id: Number(id), quantity: qty }));
      const res = await api.post('/booking/transactions', {
        showtimeId,
        seats: selectedSeats,
        addOns: addOnsToSend,
      });
      navigate(`/payment-success?bookingId=${res.data.booking.bookingId}`);
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="container p-4">Loading seats...</div>;
  if (error) return <div className="container p-4 text-[var(--error)]">{error}</div>;

  return (
    <div className="container">
      {notification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-out">
          {notification}
        </div>
      )}
      <h2 className="text-xl font-bold mb-2">Pilih Kursi - {movieTitle} - Jam: {showtime ? new Date(showtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</h2>
      <div className="mb-2 text-center font-mono text-[var(--text-secondary)]">LAYAR</div>
      <div className="flex flex-col items-center mb-2">
        {/* Column labels */}
        <div className="flex mb-2 justify-center">
          <div className="w-8" /> {/* Placeholder for row label */}
          {[...Array(COLS)].map((_, i) => (
            <div
              key={i}
              className="seat-btn font-bold flex items-center justify-center"
              style={{ pointerEvents: 'none', background: 'transparent', color: '#fff', boxShadow: 'none' }}
            >
              {i + 1}
            </div>
          ))}
        </div>
        {/* Seat grid */}
        {Array.from({ length: ROWS }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center mb-2">
            <div className="w-6 text-center font-bold">{ROW_LABELS[rowIdx]}</div>
            {Array.from({ length: COLS }).map((_, colIdx) => {
              const seat = seats.find(s => s.label === `${ROW_LABELS[rowIdx]}${colIdx + 1}`);
              return seat ? (
                <button
                  key={seat.id}
                  disabled={!seat.available}
                  onClick={() => toggleSeat(seat.id)}
                  className={`seat-btn ${!seat.available ? 'seat-occupied' : selectedSeats.includes(seat.id) ? 'seat-selected' : 'seat-available'}`}
                  title={seat.label}
                  aria-label={`Seat ${seat.label}${seat.available ? '' : ' (unavailable)'}`}
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
      <div className="flex gap-4 mb-4 text-sm justify-center">
        <div className="flex items-center"><span className="inline-block w-5 h-5 seat-selected mr-1" /> Dipilih</div>
        <div className="flex items-center"><span className="inline-block w-5 h-5 seat-occupied mr-1" /> Dipesan</div>
        <div className="flex items-center"><span className="inline-block w-5 h-5 seat-available mr-1" /> Kosong</div>
      </div>
      {/* Add-on Selection */}
      {addOns.length > 0 && (
        <div className="payment-card mb-4">
          <div className="font-semibold mb-2 text-lg border-b border-gray-700 pb-2 mb-2">Pilih Add-on (Opsional)</div>
          <div className="space-y-2">
            {addOns.map(addOn => (
              <div key={addOn.id} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium text-base">{addOn.name}</div>
                  <div className="text-xs text-[var(--text-secondary)] mb-1">{addOn.description}</div>
                  <div className="text-sm text-[var(--success)]">Rp{addOn.price}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={addOn.stock}
                    value={selectedAddOns[addOn.id] || 0}
                    onChange={e => handleAddOnChange(addOn.id, Math.max(0, Math.min(addOn.stock, Number(e.target.value))))}
                    className="input w-20 text-center"
                  />
                  <span className="text-xs text-[var(--text-secondary)]">x</span>
                  <span className="text-sm font-semibold">Rp{(selectedAddOns[addOn.id] || 0) * addOn.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Summary */}
      <div className="payment-card">
        <div className="font-semibold mb-2">Ringkasan Pesanan:</div>
        <div className="mb-1">Kursi: {selectedSeats.map(id => seats.find(s => s.id === id)?.label).filter(Boolean).join(', ') || '-'}</div>
        {addOns.length > 0 ? (
          <div className="mb-1">Add-on: {Object.entries(selectedAddOns).filter(([_, qty]) => qty > 0).length === 0 ? '-' : (
            <ul className="list-disc ml-5">
              {addOns.filter(a => selectedAddOns[a.id] > 0).map(a => (
                <li key={a.id}>{a.name} x{selectedAddOns[a.id]} (Rp{a.price * selectedAddOns[a.id]})</li>
              ))}
            </ul>
          )}</div>
        ) : (
          <div className="mb-1 text-[var(--text-secondary)]">No add-ons available.</div>
        )}
        <div className="font-bold text-lg border-t border-gray-700 pt-2 mt-2">
          Total: Rp{totalPrice.toLocaleString()}
        </div>
        <button
          onClick={handlePay}
          disabled={selectedSeats.length === 0 || paying}
          className="btn btn-primary w-full mt-4"
        >
          {paying ? 'Processing...' : 'Bayar Sekarang'}
        </button>
      </div>
    </div>
  );
};

export default SeatOrder; 