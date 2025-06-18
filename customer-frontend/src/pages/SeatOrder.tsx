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
    // Fetch add-ons
    api.get('/addons')
      .then(res => setAddOns(res.data.addOns || res.data))
      .catch(() => setAddOns([]));
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

  const handleAddOnChange = (id: number, value: number) => {
    setSelectedAddOns(prev => ({ ...prev, [id]: value }));
  };

  const totalAddOnPrice = addOns.reduce((sum, addOn) => sum + (selectedAddOns[addOn.id] || 0) * addOn.price, 0);
  const totalPrice = selectedSeats.length * SEAT_PRICE + totalAddOnPrice;

  const handlePay = async () => {
    if (!showtimeId || selectedSeats.length === 0) return;
    setPaying(true);
    try {
      const addOnsToSend = Object.entries(selectedAddOns)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({ id: Number(id), quantity: qty }));
      const res = await api.post('/booking', {
        showtimeId,
        seatIds: selectedSeats,
        addOns: addOnsToSend,
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
          {addOns.length > 0 && (
            <div className="mb-1">Add-on: {Object.entries(selectedAddOns).filter(([_, qty]) => qty > 0).length === 0 ? '-' : (
              <ul className="list-disc ml-5">
                {addOns.filter(a => selectedAddOns[a.id] > 0).map(a => (
                  <li key={a.id}>{a.name} x{selectedAddOns[a.id]} (Rp{a.price * selectedAddOns[a.id]})</li>
                ))}
              </ul>
            )}</div>
          )}
          <div className="font-bold mt-2">Total Harga: <span className="text-[var(--success)]">Rp{totalPrice}</span></div>
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