import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { authFetch, formatRupiah } from '../utils/authFetch';
import LoadingModal from '../components/LoadingModal';

interface Showtime {
  id: number;
  movieId: number;
  studioId: number;
  showDateTime: string;
  price: number;
  status: 'scheduled' | 'cancelled' | 'completed';
  isActive?: boolean;
  movie?: { title: string; posterUrl?: string };
  studio?: { studioNumber: number };
}

interface Movie {
  movieId: number;
  title: string;
}

interface Studio {
  studioId: number;
  studioNumber: number;
}

export default function Showtimes() {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [formData, setFormData] = useState({
    movieId: '',
    studioId: '',
    showDateTime: '',
    price: '',
  });

  useEffect(() => {
    fetchShowtimes();
    fetchMoviesAndStudios();
  }, []);

  const fetchMoviesAndStudios = async () => {
    try {
      const [moviesRes, studiosRes] = await Promise.all([
        authFetch('/api/movies'),
        authFetch('/api/admin/studios'),
      ]);
      if (!moviesRes.ok) throw new Error('Failed to fetch movies');
      if (!studiosRes.ok) throw new Error('Failed to fetch studios');
      const moviesData = await moviesRes.json();
      const studiosData = await studiosRes.json();
      setMovies(moviesData);
      setStudios(studiosData);
    } catch (error) {
      console.error('Error fetching movies or studios:', error);
      setError('Failed to load movies or studios. Please try again.');
    }
  };

  const fetchShowtimes = async () => {
    try {
      setError(null);
      const response = await authFetch('/api/showtimes');
      if (!response.ok) throw new Error('Failed to fetch showtimes');
      const data = await response.json();
      setShowtimes(data.map((showtime: any) => ({
        ...showtime,
        id: showtime.showtimeId,
      })));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      setError('Failed to load showtimes. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        movieId: parseInt(formData.movieId),
        studioId: parseInt(formData.studioId),
        showDateTime: new Date(formData.showDateTime).toISOString(),
        price: parseFloat(formData.price),
      };
      if (selectedShowtime) {
        const response = await authFetch(`/api/showtimes/${selectedShowtime.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update showtime');
      } else {
        const response = await authFetch('/api/showtimes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to create showtime');
      }
      setIsModalOpen(false);
      setIsUpdating(true);
      setTimeout(() => {
        setIsUpdating(false);
        fetchShowtimes();
      }, 4000);
    } catch (error) {
      console.error('Error saving showtime:', error);
      setError('Failed to save showtime. Please try again.');
    }
  };

  const handleEdit = (showtime: Showtime) => {
    setSelectedShowtime(showtime);
    const localDateTime = new Date(showtime.showDateTime).toISOString().slice(0, 16);
    setFormData({
      movieId: showtime.movieId.toString(),
      studioId: showtime.studioId.toString(),
      showDateTime: localDateTime,
      price: showtime.price.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (showtimeId: number) => {
    if (window.confirm('Are you sure you want to delete this showtime?')) {
      try {
        const response = await authFetch(`/api/showtimes/${showtimeId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete showtime');
        setIsUpdating(true);
        setTimeout(() => {
          setIsUpdating(false);
          fetchShowtimes();
        }, 4000);
      } catch (error) {
        console.error('Error deleting showtime:', error);
        setError('Failed to delete showtime. Please try again.');
      }
    }
  };

  const handleStatusToggle = async (showtime: Showtime) => {
    if (showtime.status === 'completed') return;

    try {
      const response = await authFetch(`/api/showtimes/${showtime.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !showtime.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setIsUpdating(true);
      setTimeout(() => {
        setIsUpdating(false);
        fetchShowtimes();
      }, 4000);
    } catch (error) {
      console.error('Error toggling showtime status:', error);
      setError('Failed to update showtime status. Please try again.');
    }
  };

  const scheduledShowtimes = showtimes.filter(s => s.status === 'scheduled').length;
  const completedShowtimes = showtimes.filter(s => s.status === 'completed').length;
  const cancelledShowtimes = showtimes.filter(s => s.status === 'cancelled').length;
  const stats = [
    { name: 'Total Showtimes', value: showtimes.length, icon: CalendarDaysIcon },
    { name: 'Scheduled', value: scheduledShowtimes, icon: ClockIcon },
    { name: 'Completed', value: completedShowtimes, icon: CheckCircleIcon },
    { name: 'Cancelled', value: cancelledShowtimes, icon: XCircleIcon },
  ];

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-40 mt-4 sm:mt-0"></div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="h-28 bg-gray-200 rounded-xl"></div>
          <div className="h-28 bg-gray-200 rounded-xl"></div>
          <div className="h-28 bg-gray-200 rounded-xl"></div>
          <div className="h-28 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="bg-gray-200 rounded-lg h-96"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <LoadingModal isOpen={isUpdating} message="Updating showtimes..." />
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Showtimes</h1>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setSelectedShowtime(null);
              setFormData({
                movieId: '',
                studioId: '',
                showDateTime: '',
                price: '',
              });
              setIsModalOpen(true);
            }}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Add Showtime
          </button>
        </div>
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
                      Movie
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Studio
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date & Time
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Price
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {showtimes.map((showtime) => (
                    <tr key={showtime.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-md"
                              src={showtime.movie?.posterUrl}
                              alt=""
                              onError={(e) => {
                                (e.target as any).src = 'https://via.placeholder.com/40';
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{showtime.movie?.title || '...'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className="inline-flex rounded-full bg-purple-100 px-2 text-xs font-semibold leading-5 text-purple-800">
                          Studio {showtime.studio?.studioNumber || '...'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div>{new Date(showtime.showDateTime).toLocaleDateString('en-GB')}</div>
                        <div className="text-gray-400">
                          {new Date(showtime.showDateTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                        {formatRupiah(showtime.price)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => handleStatusToggle(showtime)}
                          disabled={showtime.status === 'completed'}
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ring-1 ring-inset transition-colors ${
                            showtime.status === 'scheduled'
                              ? 'bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100'
                              : showtime.status === 'cancelled'
                              ? 'bg-red-50 text-red-700 ring-red-600/20 hover:bg-red-100'
                              : 'bg-gray-100 text-gray-600 ring-gray-500/20 cursor-not-allowed'
                          }`}
                        >
                          {showtime.status}
                        </button>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleEdit(showtime)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(showtime.id)}
                            className="text-red-600 hover:text-red-900"
                          >
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <form onSubmit={handleSubmit}>
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {selectedShowtime ? 'Edit Showtime' : 'Add New Showtime'}
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="movieId" className="block text-sm font-medium text-gray-700">
                        Movie
                      </label>
                      <select
                        id="movieId"
                        name="movieId"
                        value={formData.movieId}
                        onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                        className="input-field mt-1"
                        required
                      >
                        <option value="">Select a movie</option>
                        {movies.map((movie) => (
                          <option key={movie.movieId} value={movie.movieId}>
                            {movie.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="studioId" className="block text-sm font-medium text-gray-700">
                        Studio
                      </label>
                      <select
                        id="studioId"
                        name="studioId"
                        value={formData.studioId}
                        onChange={(e) => setFormData({ ...formData, studioId: e.target.value })}
                        className="input-field mt-1"
                        required
                      >
                        <option value="">Select a studio</option>
                        {studios.map((studio) => (
                          <option key={studio.studioId} value={studio.studioId}>
                            Studio {studio.studioNumber}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="showDateTime" className="block text-sm font-medium text-gray-700">
                        Date and Time
                      </label>
                      <input
                        type="datetime-local"
                        name="showDateTime"
                        id="showDateTime"
                        value={formData.showDateTime}
                        onChange={(e) => setFormData({ ...formData, showDateTime: e.target.value })}
                        className="input-field mt-1"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Price (IDR)
                      </label>
                      <input
                        type="number"
                        name="price"
                        id="price"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="input-field mt-1"
                        required
                        min="0"
                        step="1000"
                        placeholder="50000"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    className="btn-primary sm:col-start-2"
                  >
                    {selectedShowtime ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary mt-3 sm:col-start-1 sm:mt-0"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 