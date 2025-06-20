import React, { useState, useEffect } from 'react';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { authFetch } from '../utils/authFetch';

interface Booking {
  id: number;
  userId: number;
  showtimeId: number;
  seats: string[];
  totalAmount: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  movieTitle: string;
  showtimeDate: string;
  showtimeTime: string;
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await authFetch('/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      // Map backend bookingId to id for frontend
      setBookings(data.map((booking: any) => ({
        ...booking,
        id: booking.bookingId,
      })));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setIsLoading(false);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        // Update booking status to 'cancelled'
        const response = await authFetch(`/bookings/${bookingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        });
        if (!response.ok) throw new Error('Failed to cancel booking');
        fetchBookings();
      } catch (error) {
        console.error('Error cancelling booking:', error);
      }
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all movie bookings including their status, seats, and total amount.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Booking ID</th>
                <th className="table-header-cell">Movie</th>
                <th className="table-header-cell">Showtime</th>
                <th className="table-header-cell">Seats</th>
                <th className="table-header-cell">Amount</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {bookings.length === 0 ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={7}>
                    <div className="text-center text-gray-500 py-4">
                      {isLoading ? 'Loading...' : 'No bookings found'}
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="table-row">
                    <td className="table-cell">#{booking.id}</td>
                    <td className="table-cell">{booking.movieTitle}</td>
                    <td className="table-cell">
                      {new Date(booking.showtimeDate).toLocaleDateString()} {booking.showtimeTime}
                    </td>
                    <td className="table-cell">{booking.seats.join(', ')}</td>
                    <td className="table-cell">${booking.totalAmount}</td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleViewDetails(booking)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Booking Details</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Booking ID</p>
                    <p className="mt-1">#{selectedBooking.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Movie</p>
                    <p className="mt-1">{selectedBooking.movieTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Showtime</p>
                    <p className="mt-1">
                      {new Date(selectedBooking.showtimeDate).toLocaleDateString()}{' '}
                      {selectedBooking.showtimeTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Seats</p>
                    <p className="mt-1">{selectedBooking.seats.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="mt-1">${selectedBooking.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          selectedBooking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : selectedBooking.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {selectedBooking.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Booked On</p>
                    <p className="mt-1">{new Date(selectedBooking.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 