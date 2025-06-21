import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, FilmIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { authFetch } from '../utils/authFetch';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    duration: '',
    releaseDate: '',
    genre: [],
    director: '',
    actors: '',
    productionHouse: '',
    posterUrl: '',
    isActive: true,
  });
  const [genreInput, setGenreInput] = useState('');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setError(null);
      const response = await authFetch('/api/movies');
      if (!response.ok) throw new Error('Failed to fetch movies');
      const data = await response.json();
      setMovies(data.map(m => ({
        ...m,
        id: m.movieId,
      })));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Failed to load movies. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        genre: formData.genre.join(', '),
      };

      if (selectedMovie) {
        // Update movie
        const response = await authFetch(`/api/movies/${selectedMovie.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update movie');
      } else {
        // Create movie
        const response = await authFetch('/api/movies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to create movie');
      }
      setIsModalOpen(false);
      setTimeout(() => fetchMovies(), 3000);
    } catch (error) {
      console.error('Error saving movie:', error);
      setError('Failed to save movie. Please try again.');
    }
  };

  const handleEdit = (movie) => {
    setSelectedMovie(movie);
    setFormData({
      title: movie.title || '',
      synopsis: movie.synopsis || movie.description || '',
      duration: movie.duration || '',
      releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : '',
      genre: movie.genre ? movie.genre.split(',').map(g => g.trim()).filter(Boolean) : [],
      director: movie.director || '',
      actors: movie.actors || movie.cast || '',
      productionHouse: movie.productionHouse || '',
      posterUrl: movie.posterUrl || '',
      isActive: movie.isActive,
    });
    setGenreInput('');
    setIsModalOpen(true);
  };

  const handleDelete = async (movieId) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        const response = await authFetch(`/api/movies/${movieId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete movie');
        setTimeout(() => fetchMovies(), 3000);
      } catch (error) {
        console.error('Error deleting movie:', error);
        setError('Failed to delete movie. Please try again.');
      }
    }
  };

  const handleStatusToggle = async (movie) => {
    try {
      const response = await authFetch(`/api/movies/${movie.movieId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !movie.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setMovies(movies.map(m =>
        m.movieId === movie.movieId ? { ...m, isActive: !movie.isActive } : m
      ));
    } catch (error) {
      console.error('Error toggling movie status:', error);
      setError('Failed to update movie status. Please try again.');
    }
  };

  const handleGenreKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newGenre = genreInput.trim();
      if (newGenre && !formData.genre.includes(newGenre)) {
        setFormData({ ...formData, genre: [...formData.genre, newGenre] });
      }
      setGenreInput('');
    }
  };

  const removeGenre = (genreToRemove) => {
    setFormData({
      ...formData,
      genre: formData.genre.filter(genre => genre !== genreToRemove),
    });
  };

  const totalMovies = movies.length;
  const activeMovies = movies.filter(movie => movie.isActive).length;
  const inactiveMovies = totalMovies - activeMovies;

  const stats = [
    { name: 'Total Movies', value: totalMovies, icon: FilmIcon },
    { name: 'Active Movies', value: activeMovies, icon: CheckCircleIcon },
    { name: 'Inactive Movies', value: inactiveMovies, icon: XCircleIcon },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">Loading movies...</div>
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Movies Dashboard</h1>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setSelectedMovie(null);
              setFormData({
                title: '',
                synopsis: '',
                duration: '',
                releaseDate: '',
                genre: [],
                director: '',
                actors: '',
                productionHouse: '',
                posterUrl: '',
                isActive: true,
              });
              setGenreInput('');
              setIsModalOpen(true);
            }}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Add Movie
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                      Title
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Genre
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Duration
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Release Date
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
                  {movies.map((movie) => (
                    <tr key={movie.movieId}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-md"
                              src={movie.posterUrl}
                              alt=""
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/40';
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{movie.title}</div>
                            <div className="text-gray-500">Dir. {movie.director}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {movie.genre}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{movie.duration} min</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(movie.releaseDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => handleStatusToggle(movie)}
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                            movie.isActive
                              ? 'bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100'
                              : 'bg-red-50 text-red-700 ring-red-600/20 hover:bg-red-100'
                          }`}
                        >
                          {movie.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleEdit({ ...movie, id: movie.movieId })}
                            className="text-gray-400 hover:text-indigo-600"
                          >
                            <PencilIcon className="h-5 w-5" />
                            <span className="sr-only">, {movie.name}</span>
                          </button>
                          <button
                            onClick={() => handleDelete(movie.movieId)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <TrashIcon className="h-5 w-5" />
                            <span className="sr-only">, {movie.name}</span>
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
                    {selectedMovie ? 'Edit Movie' : 'Add New Movie'}
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="input-field mt-1"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="synopsis" className="block text-sm font-medium text-gray-700">
                        Synopsis
                      </label>
                      <textarea
                        name="synopsis"
                        id="synopsis"
                        rows={3}
                        value={formData.synopsis}
                        onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                        className="input-field mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                        Duration (min)
                      </label>
                      <input
                        type="number"
                        name="duration"
                        id="duration"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        className="input-field mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700">
                        Release Date
                      </label>
                      <input
                        type="date"
                        name="releaseDate"
                        id="releaseDate"
                        value={formData.releaseDate}
                        onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                        className="input-field mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="genre" className="block text-sm font-medium text-gray-700">
                        Genre
                      </label>
                      <div className="mt-1 flex flex-wrap items-center gap-2 rounded-md border border-gray-300 p-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                        {formData.genre.map((genre) => (
                          <span key={genre} className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            {genre}
                            <button
                              type="button"
                              onClick={() => removeGenre(genre)}
                              className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-blue-600/20"
                            >
                              <span className="sr-only">Remove</span>
                              <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 stroke-blue-600/50 group-hover:stroke-blue-600/75">
                                <path d="M4 4l6 6m0-6l-6 6" />
                              </svg>
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          id="genre"
                          value={genreInput}
                          onChange={(e) => setGenreInput(e.target.value)}
                          onKeyDown={handleGenreKeyDown}
                          className="flex-grow border-0 p-0 text-sm placeholder-gray-500 focus:ring-0"
                          placeholder="Add genres..."
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Press Enter or comma to add a genre.</p>
                    </div>
                    <div>
                      <label htmlFor="director" className="block text-sm font-medium text-gray-700">
                        Director
                      </label>
                      <input
                        type="text"
                        name="director"
                        id="director"
                        value={formData.director}
                        onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                        className="input-field mt-1"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="actors" className="block text-sm font-medium text-gray-700">
                        Actors
                      </label>
                      <input
                        type="text"
                        name="actors"
                        id="actors"
                        value={formData.actors}
                        onChange={(e) => setFormData({ ...formData, actors: e.target.value })}
                        className="input-field mt-1"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="productionHouse" className="block text-sm font-medium text-gray-700">
                        Production House
                      </label>
                      <input
                        type="text"
                        name="productionHouse"
                        id="productionHouse"
                        value={formData.productionHouse}
                        onChange={(e) => setFormData({ ...formData, productionHouse: e.target.value })}
                        className="input-field mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="posterUrl" className="block text-sm font-medium text-gray-700">
                        Poster URL
                      </label>
                      <input
                        type="url"
                        name="posterUrl"
                        id="posterUrl"
                        value={formData.posterUrl}
                        onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                        className="input-field mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="relative flex items-start">
                        <div className="flex h-6 items-center">
                          <input
                            id="isActive"
                            name="isActive"
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                          <label htmlFor="isActive" className="font-medium text-gray-900">
                            Active
                          </label>
                          <p className="text-gray-500">Uncheck to make this movie unavailable for showtimes.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    className="btn-primary sm:col-start-2"
                  >
                    {selectedMovie ? 'Update' : 'Create'}
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