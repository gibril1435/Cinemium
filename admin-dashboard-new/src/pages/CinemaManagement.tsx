import React, { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../utils/authFetch';

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
  const [activeTab, setActiveTab] = useState<'movies' | 'showtimes' | 'studios'>('movies');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'movies': {
          const response = await authFetch('/movies');
          if (!response.ok) throw new Error('Failed to fetch movies');
          const data = await response.json();
          setMovies(data.map((movie: any) => ({ ...movie, id: movie.movieId })));
          break;
        }
        case 'showtimes': {
          const response = await authFetch('/showtimes');
          if (!response.ok) throw new Error('Failed to fetch showtimes');
          const data = await response.json();
          setShowtimes(data.map((showtime: any) => ({ ...showtime, id: showtime.showtimeId })));
          break;
        }
        case 'studios': {
          const response = await authFetch('/studios');
          if (!response.ok) throw new Error('Failed to fetch studios');
          const data = await response.json();
          setStudios(data.map((studio: any) => ({ ...studio, id: studio.studioId })));
          break;
        }
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-[var(--error)]">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Cinema Management</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'movies' ? 'bg-[var(--primary)] text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('movies')}
        >
          Movies
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'showtimes' ? 'bg-[var(--primary)] text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('showtimes')}
        >
          Showtimes
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'studios' ? 'bg-[var(--primary)] text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('studios')}
        >
          Studios
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {activeTab === 'movies' && (
          <div className="p-4">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Movies</h2>
              <button className="btn btn-primary">Add Movie</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {movies.map(movie => (
                <div key={movie.id} className="border rounded-lg p-4">
                  {movie.posterUrl && (
                    <img src={movie.posterUrl} alt={movie.title} className="w-full h-48 object-cover rounded mb-4" />
                  )}
                  <h3 className="font-bold">{movie.title}</h3>
                  <p className="text-sm text-gray-600">{movie.genre}</p>
                  <p className="text-sm mt-2">{movie.synopsis}</p>
                  <div className="mt-4 flex gap-2">
                    <button className="btn btn-secondary">Edit</button>
                    <button className="btn btn-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'showtimes' && (
          <div className="p-4">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Showtimes</h2>
              <button className="btn btn-primary">Add Showtime</button>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Movie</th>
                  <th className="px-4 py-2 text-left">Studio</th>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {showtimes.map(st => (
                  <tr key={st.id} className="border-t">
                    <td className="px-4 py-2">{movies.find(m => m.id === st.movieId)?.title}</td>
                    <td className="px-4 py-2">{studios.find(s => s.id === st.studioId)?.name}</td>
                    <td className="px-4 py-2">{new Date(st.time).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">Rp{st.price}</td>
                    <td className="px-4 py-2 text-center">
                      <button className="btn btn-secondary mr-2">Edit</button>
                      <button className="btn btn-danger">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'studios' && (
          <div className="p-4">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Studios</h2>
              <button className="btn btn-primary">Add Studio</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studios.map(studio => (
                <div key={studio.id} className="border rounded-lg p-4">
                  <h3 className="font-bold">{studio.name}</h3>
                  <p className="text-sm text-gray-600">Capacity: {studio.capacity} seats</p>
                  <div className="mt-4 flex gap-2">
                    <button className="btn btn-secondary">Edit</button>
                    <button className="btn btn-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CinemaManagement; 