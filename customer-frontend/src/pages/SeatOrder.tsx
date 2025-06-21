import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
  category: string;
  imageUrl: string;
}

const SeatOrder: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [movieTitle, setMovieTitle] = useState('');
  const [showtime, setShowtime] = useState<any>(null);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<{ [id: number]: number }>({});
  const [notification, setNotification] = useState<string | null>(null);

  const ROWS = 5;
  const COLS = 8;
  const ROW_LABELS = ['A', 'B', 'C', 'D', 'E'];
  const SEAT_PRICE = 50000;

  useEffect(() => {
    if (!showtimeId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [showtimeRes, seatsRes, addOnsRes] = await Promise.all([
          api.get(`/booking/showtimes/${showtimeId}`),
          api.get(`/booking/showtimes/${showtimeId}/seats`),
          api.get('/addons'),
        ]);

        const currentShowtime = showtimeRes.data;
        setShowtime(currentShowtime);
        setSeats(seatsRes.data.layout?.seats || []);
        setAddOns(addOnsRes.data.map((a: any) => ({...a, id: a.addOnId})));

        if (currentShowtime.movieId) {
          const movieRes = await api.get(`/movies/${currentShowtime.movieId}`);
          setMovieTitle(movieRes.data.title || '');
        }

      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load booking information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showtimeId]);

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
  const totalPrice = selectedSeats.length * (showtime?.price || 0) + totalAddOnPrice;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-8">
              {/* Header skeleton */}
              <div className="h-8 bg-gray-800 w-3/4 rounded"></div>
              
              {/* Screen skeleton */}
              <div className="h-4 bg-gray-800 w-32 mx-auto rounded"></div>
              
              {/* Seats grid skeleton */}
              <div className="grid grid-cols-8 gap-2 max-w-2xl mx-auto">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-800 rounded"></div>
                ))}
              </div>
              
              {/* Add-ons skeleton */}
              <div className="space-y-4">
                <div className="h-6 bg-gray-800 w-48 rounded"></div>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-800 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-900/50 border border-red-500 text-red-100 px-6 py-4 rounded-lg">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      {notification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out">
          {notification}
        </div>
      )}
      
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {movieTitle}
            </h1>
            <p className="text-gray-400">
              {showtime ? new Date(showtime.showDateTime).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : ''}
            </p>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-[1fr,auto] gap-8">
            {/* Left Column - Seat Selection */}
            <div>
              {/* Screen */}
              <div className="relative mb-8">
                <div className="h-2 bg-yellow-500/20 rounded-full mb-2"></div>
                <div className="text-center text-sm text-gray-400 uppercase tracking-wider">Screen</div>
              </div>

              {/* Seat Grid */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 mb-8">
                <div className="flex flex-col items-center">
                  {/* Column labels */}
                  <div className="grid grid-cols-9 gap-x-2 mb-2 w-fit mx-auto">
                    <div /> {/* Empty for row label space */}
                    {[...Array(COLS)].map((_, i) => (
                      <div key={i} className="w-10 h-10 flex items-center justify-center text-gray-400 text-sm">
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Seat grid */}
                  {Array.from({ length: ROWS }).map((_, rowIdx) => (
                    <div key={rowIdx} className="grid grid-cols-9 gap-x-2 w-fit mx-auto mb-2">
                      <div className="w-10 h-10 flex items-center justify-center font-medium text-gray-400">
                        {ROW_LABELS[rowIdx]}
                      </div>
                      {Array.from({ length: COLS }).map((_, colIdx) => {
                        const seat = seats.find(s => s.label === `${ROW_LABELS[rowIdx]}${colIdx + 1}`);
                        return seat ? (
                          <button
                            key={seat.id}
                            disabled={!seat.available}
                            onClick={() => toggleSeat(seat.id)}
                            className={
                              `w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center ` +
                              (!seat.available ?
                                'bg-gray-700 cursor-not-allowed opacity-50' :
                                selectedSeats.includes(seat.id) ?
                                  'bg-yellow-500 text-black hover:bg-yellow-400' :
                                  'bg-gray-700 hover:bg-gray-600')
                            }
                            title={seat.label}
                            aria-label={`Seat ${seat.label}${seat.available ? '' : ' (unavailable)'}`}
                          >
                            {colIdx + 1}
                          </button>
                        ) : (
                          <div key={colIdx} className="w-10 h-10" />
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex gap-6 justify-center mt-6 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded bg-yellow-500 mr-2"></div>
                    <span className="text-gray-300">Selected</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded bg-gray-700 opacity-50 mr-2"></div>
                    <span className="text-gray-300">Occupied</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded bg-gray-700 mr-2"></div>
                    <span className="text-gray-300">Available</span>
                  </div>
                </div>
              </div>

              {/* Add-ons Section */}
              {addOns.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Add-ons (Optional)</h2>
                  <div className="space-y-4">
                    {addOns.map(addOn => (
                      <div 
                        key={addOn.id} 
                        className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-white mb-1">{addOn.name}</h3>
                          <p className="text-sm text-gray-400 mb-2">{addOn.description}</p>
                          <p className="text-yellow-500">Rp{addOn.price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleAddOnChange(addOn.id, Math.max(0, (selectedAddOns[addOn.id] || 0) - 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                            disabled={(selectedAddOns[addOn.id] || 0) === 0}
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-white">
                            {selectedAddOns[addOn.id] || 0}
                          </span>
                          <button
                            onClick={() => handleAddOnChange(addOn.id, Math.min(addOn.stock, (selectedAddOns[addOn.id] || 0) + 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                            disabled={(selectedAddOns[addOn.id] || 0) === addOn.stock}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="w-full md:w-80">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
                
                {/* Selected Seats */}
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">Selected Seats</div>
                  {selectedSeats.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map(seatId => {
                        const seat = seats.find(s => s.id === seatId);
                        return seat && (
                          <div key={seatId} className="px-2 py-1 bg-gray-700 rounded text-sm text-white">
                            {seat.label}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No seats selected</div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Seats ({selectedSeats.length})</span>
                    <span className="text-white">Rp{(selectedSeats.length * (showtime?.price || 0)).toLocaleString()}</span>
                  </div>
                  {totalAddOnPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Add-ons</span>
                      <span className="text-white">Rp{totalAddOnPrice.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-white">Total</span>
                      <span className="text-yellow-500">Rp{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePay}
                  disabled={selectedSeats.length === 0 || paying}
                  className={`
                    w-full py-3 rounded-lg font-medium transition-all duration-200
                    ${selectedSeats.length === 0 || paying ?
                      'bg-gray-700 text-gray-400 cursor-not-allowed' :
                      'bg-yellow-500 hover:bg-yellow-400 text-black'
                    }
                  `}
                >
                  {paying ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatOrder; 