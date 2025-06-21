import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  TrashIcon,
  TicketIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { authFetch, formatRupiah } from '../utils/authFetch';

interface Booking {
  id: number;
  user: {
    username: string;
    email: string;
  };
  seats: string[];
  totalAmount: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  bookingDate: string;
  movieTitle: string;
  posterUrl?: string;
  showtimeDate: string;
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setError(null);
      const response = await authFetch('/api/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      setBookings(data.map((booking: any) => ({
        ...booking,
        id: booking.bookingId,
      })).sort((a: Booking, b: Booking) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings. Please try again.');
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (booking: Booking) => {
    if (booking.status === 'completed') return;

    const newStatus = booking.status === 'confirmed' ? 'cancelled' : 'confirmed';
    try {
      const response = await authFetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');

      // Optimistically update the UI
      setBookings(bookings.map(b =>
        b.id === booking.id ? { ...b, status: newStatus } : b
      ));
    } catch (error) {
      console.error('Error toggling booking status:', error);
      setError('Failed to update booking status. Please try again.');
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleDeleteBooking = async (bookingId: number) => {
    if (window.confirm('Are you sure you want to delete this booking? This action is irreversible.')) {
      try {
        const response = await authFetch(`/api/bookings/${bookingId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete booking');
        setTimeout(() => fetchBookings(), 1000);
      } catch (error) {
        console.error('Error deleting booking:', error);
        setError('Failed to delete booking. Please try again.');
      }
    }
  };

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
  const stats = [
    { name: 'Total Bookings', value: bookings.length, icon: TicketIcon },
    { name: 'Confirmed', value: confirmedBookings, icon: ClockIcon },
    { name: 'Completed', value: completedBookings, icon: CheckCircleIcon },
    { name: 'Cancelled', value: cancelledBookings, icon: XCircleIcon },
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading bookings...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bookings</h1>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.name}
              className="transform overflow-hidden rounded-xl bg-white bg-gradient-to-br from-white to-gray-50 shadow-lg transition-transform hover:scale-105"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col space-y-2">
                    <p className="text-md font-medium text-gray-500">{item.name}</p>
                    <p className="text-4xl font-bold text-gray-900">{item.value}</p>
                  </div>
                  <div className="rounded-full bg-primary-100 p-4">
                    <item.icon className="h-8 w-8 text-primary-600" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      User / Booking ID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Movie
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Showtime
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Seats
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900">{booking.user?.username || 'N/A'}</div>
                        <div className="text-gray-500">#{booking.id}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img className="h-10 w-10 rounded-md" src={booking.posterUrl} alt="" onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/40'; }} />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{booking.movieTitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div>{new Date(booking.showtimeDate).toLocaleDateString('en-GB')}</div>
                        <div className="text-gray-400">
                          {new Date(booking.showtimeDate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {booking.seats.map((seat) => (
                            <span key={seat} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                              {seat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{formatRupiah(booking.totalAmount)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => handleToggleStatus(booking)}
                          disabled={booking.status === 'completed'}
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ring-1 ring-inset transition-colors ${
                            booking.status === 'confirmed'
                              ? 'bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100'
                              : booking.status === 'cancelled'
                              ? 'bg-red-50 text-red-700 ring-red-600/20 hover:bg-red-100'
                              : 'bg-gray-100 text-gray-600 ring-gray-500/20 cursor-not-allowed'
                          }`}
                        >
                          {booking.status}
                        </button>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center space-x-4">
                          <button onClick={() => handleViewDetails(booking)} className="text-gray-400 hover:text-indigo-600">
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDeleteBooking(booking.id)} className="text-gray-400 hover:text-red-600">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Booking Details</h3>
                <div className="mt-4 grid grid-cols-2 gap-y-4 gap-x-2">
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Movie</p>
                    <p className="mt-1 font-medium text-gray-900">{selectedBooking.movieTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">User</p>
                    <p className="mt-1">{selectedBooking.user?.username || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Booking ID</p>
                    <p className="mt-1 font-mono">#{selectedBooking.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Showtime</p>
                    <p className="mt-1">{new Date(selectedBooking.showtimeDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Amount</p>
                    <p className="mt-1 font-medium">{formatRupiah(selectedBooking.totalAmount)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Seats</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedBooking.seats.map((seat) => (
                         <span key={seat} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                           {seat}
                         </span>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span className={`mt-1 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      selectedBooking.status === 'confirmed' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'
                    }`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-6">
                <button type="button" className="btn-secondary w-full" onClick={() => setIsModalOpen(false)}>
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