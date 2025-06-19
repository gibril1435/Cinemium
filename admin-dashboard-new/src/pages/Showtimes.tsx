import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Showtime {
  id: number;
  movieId: number;
  studioId: number;
  startTime: string;
  endTime: string;
  date: string;
  price: number;
  status: 'scheduled' | 'cancelled' | 'completed';
}

export default function Showtimes() {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [formData, setFormData] = useState({
    movieId: '',
    studioId: '',
    startTime: '',
    date: '',
    price: '',
  });

  useEffect(() => {
    fetchShowtimes();
  }, []);

  const fetchShowtimes = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await axios.get('/api/admin/showtimes');
      // setShowtimes(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedShowtime) {
        // await axios.put(`/api/admin/showtimes/${selectedShowtime.id}`, formData);
      } else {
        // await axios.post('/api/admin/showtimes', formData);
      }
      setIsModalOpen(false);
      fetchShowtimes();
    } catch (error) {
      console.error('Error saving showtime:', error);
    }
  };

  const handleEdit = (showtime: Showtime) => {
    setSelectedShowtime(showtime);
    setFormData({
      movieId: showtime.movieId.toString(),
      studioId: showtime.studioId.toString(),
      startTime: showtime.startTime,
      date: showtime.date,
      price: showtime.price.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (showtimeId: number) => {
    if (window.confirm('Are you sure you want to delete this showtime?')) {
      try {
        // await axios.delete(`/api/admin/showtimes/${showtimeId}`);
        fetchShowtimes();
      } catch (error) {
        console.error('Error deleting showtime:', error);
      }
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Showtimes</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all movie showtimes including their schedule, studio, and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setSelectedShowtime(null);
              setFormData({
                movieId: '',
                studioId: '',
                startTime: '',
                date: '',
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
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Movie</th>
                <th className="table-header-cell">Studio</th>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Time</th>
                <th className="table-header-cell">Price</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {showtimes.length === 0 ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={7}>
                    <div className="text-center text-gray-500 py-4">
                      {isLoading ? 'Loading...' : 'No showtimes found'}
                    </div>
                  </td>
                </tr>
              ) : (
                showtimes.map((showtime) => (
                  <tr key={showtime.id} className="table-row">
                    <td className="table-cell">{showtime.movieId}</td>
                    <td className="table-cell">{showtime.studioId}</td>
                    <td className="table-cell">{new Date(showtime.date).toLocaleDateString()}</td>
                    <td className="table-cell">{showtime.startTime}</td>
                    <td className="table-cell">${showtime.price}</td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          showtime.status === 'scheduled'
                            ? 'bg-green-100 text-green-800'
                            : showtime.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {showtime.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(showtime)}
                          className="text-primary-600 hover:text-primary-900"
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Showtime Form Modal */}
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
                        {/* TODO: Add movie options */}
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
                        {/* TODO: Add studio options */}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        id="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="input-field mt-1"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                        Start Time
                      </label>
                      <input
                        type="time"
                        name="startTime"
                        id="startTime"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="input-field mt-1"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Price
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
                        step="0.01"
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