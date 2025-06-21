import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { authFetch, formatRupiah } from '../utils/authFetch';

type Movie = {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  posterUrl?: string;
  studio?: string;
};

type Showtime = {
  id: string;
  movieId: string;
  studioId: string;
  time: string;
  price: number;
};

type Studio = {
  id: string;
  name: string;
  capacity: number;
};

const CinemaManagement: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'movies' | 'showtimes' | 'studios'>('movies');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [moviesRes, showtimesRes, studiosRes] = await Promise.all([
        authFetch('/api/movies'),
        authFetch('/api/showtimes'),
        authFetch('/api/admin/studios'),
      ]);

      if (!moviesRes.ok) throw new Error('Failed to fetch movies');
      if (!showtimesRes.ok) throw new Error('Failed to fetch showtimes');
      if (!studiosRes.ok) throw new Error('Failed to fetch studios');

      const moviesData = await moviesRes.json();
      const showtimesData = await showtimesRes.json();
      const studiosData = await studiosRes.json();

      setMovies(moviesData);
      setShowtimes(showtimesData);
      setStudios(studiosData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load cinema data. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">Loading cinema management...</div>
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
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Cinema Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage movies, showtimes, and studio information in one place.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mt-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('movies')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'movies'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Movies ({movies.length})
          </button>
          <button
            onClick={() => setActiveTab('showtimes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'showtimes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Showtimes ({showtimes.length})
          </button>
          <button
            onClick={() => setActiveTab('studios')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'studios'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Studios ({studios.length})
          </button>
        </nav>
      </div>

      {/* Movies Tab */}
      {activeTab === 'movies' && (
        <div className="mt-8">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Title</th>
                  <th className="table-header-cell">Genre</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {movies.length === 0 ? (
                  <tr className="table-row">
                    <td className="table-cell" colSpan={4}>
                      <div className="text-center text-gray-500 py-8">
                        <div className="text-lg font-medium">No movies found</div>
                        <div className="text-sm">Add movies to get started.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  movies.map((movie) => (
                    <tr key={movie.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center">
                          {movie.posterUrl && (
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="h-10 w-10 rounded object-cover mr-3"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{movie.title}</div>
                            <div className="text-sm text-gray-500">{movie.genre}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {movie.genre}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-3">
                          <button
                            className="text-primary-600 hover:text-primary-900 transition-colors"
                            title="Edit movie"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete movie"
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
      )}

      {/* Showtimes Tab */}
      {activeTab === 'showtimes' && (
        <div className="mt-8">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Movie</th>
                  <th className="table-header-cell">Studio</th>
                  <th className="table-header-cell">Time</th>
                  <th className="table-header-cell">Price</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {showtimes.length === 0 ? (
                  <tr className="table-row">
                    <td className="table-cell" colSpan={5}>
                      <div className="text-center text-gray-500 py-8">
                        <div className="text-lg font-medium">No showtimes found</div>
                        <div className="text-sm">Add showtimes to get started.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  showtimes.map((showtime) => (
                    <tr key={showtime.id} className="table-row">
                      <td className="table-cell font-medium text-gray-900">
                        {movies.find(m => m.id === showtime.movieId)?.title || 'Unknown Movie'}
                      </td>
                      <td className="table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Studio {studios.find(s => s.id === showtime.studioId)?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">
                          {new Date(showtime.time).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(showtime.time).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className="table-cell font-medium text-gray-900">
                        {formatRupiah(showtime.price)}
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-3">
                          <button
                            className="text-primary-600 hover:text-primary-900 transition-colors"
                            title="Edit showtime"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete showtime"
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
      )}

      {/* Studios Tab */}
      {activeTab === 'studios' && (
        <div className="mt-8">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">Capacity</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {studios.length === 0 ? (
                  <tr className="table-row">
                    <td className="table-cell" colSpan={4}>
                      <div className="text-center text-gray-500 py-8">
                        <div className="text-lg font-medium">No studios found</div>
                        <div className="text-sm">Add studios to get started.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  studios.map((studio) => (
                    <tr key={studio.id} className="table-row">
                      <td className="table-cell font-medium text-gray-900">{studio.name}</td>
                      <td className="table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {studio.capacity} seats
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-3">
                          <button
                            className="text-primary-600 hover:text-primary-900 transition-colors"
                            title="Edit studio"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete studio"
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
      )}
    </div>
  );
};

export default CinemaManagement; 