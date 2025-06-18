import React, { useEffect, useState } from 'react';
import api from '../api';
import Header from '../components/Header';

type Movie = {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  posterUrl?: string;
  actors?: string[];
  director?: string;
  writer?: string;
  studio?: string;
};

const AdminMovieManagement: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/movies')
      .then(res => {
        setMovies(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load movies');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="container p-4">Loading movies...</div>;
  if (error) return <div className="container p-4 text-[var(--error)]">{error}</div>;

  return (
    <>
      <Header />
      <div className="container">
        <h2 className="text-xl font-bold mb-4">Admin Movie Management</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--secondary)]">
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Genre</th>
              <th className="p-2 text-left">Synopsis</th>
              <th className="p-2 text-left">Studio</th>
            </tr>
          </thead>
          <tbody>
            {movies.map(movie => (
              <tr key={movie.id} className="border-b border-gray-700">
                <td className="p-2">{movie.title}</td>
                <td className="p-2">{movie.genre}</td>
                <td className="p-2">{movie.synopsis}</td>
                <td className="p-2">{movie.studio || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AdminMovieManagement; 