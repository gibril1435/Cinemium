import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

type Showtime = {
  id: string;
  time: string;
};

const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedShowtime, setSelectedShowtime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/movies/${id}`),
      api.get(`/movies/${id}/showtimes`)
    ])
      .then(([movieRes, showtimeRes]) => {
        setMovie(movieRes.data);
        setShowtimes(showtimeRes.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load movie details');
        setLoading(false);
      });
  }, [id]);

  const handleBuyTicket = () => {
    if (!selectedShowtime) return;
    navigate(`/seat-order?movieId=${id}&showtimeId=${selectedShowtime}`);
  };

  if (loading) return <div className="container p-4">Loading movie details...</div>;
  if (error) return <div className="container p-4 text-[var(--error)]">{error}</div>;
  if (!movie) return <div className="container p-4">Movie not found.</div>;

  return (
    <>
      <Header />
      <div className="container">
        <div className="movie-detail">
          {movie.posterUrl && (
            <div className="movie-detail-poster">
              <img src={movie.posterUrl} alt={movie.title} className="w-full h-auto rounded-lg" />
            </div>
          )}
          <div className="movie-detail-info">
            <h1 className="movie-detail-title">{movie.title}</h1>
            <p className="movie-detail-meta">{movie.genre}</p>
            <p className="movie-detail-description">{movie.synopsis}</p>
            <div className="space-y-2">
              <div className="movie-detail-meta"><b>Aktor:</b> {movie.actors?.join(', ') || 'N/A'}</div>
              <div className="movie-detail-meta"><b>Sutradara:</b> {movie.director || 'N/A'}</div>
              <div className="movie-detail-meta"><b>Penulis:</b> {movie.writer || 'N/A'}</div>
              <div className="movie-detail-meta"><b>Rumah Produksi:</b> {movie.studio || 'N/A'}</div>
            </div>
            <div className="mt-6">
              <label className="form-label">Pilih Jam Tayang:</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {showtimes.map(st => (
                  <button
                    key={st.id}
                    className={`btn ${selectedShowtime === st.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedShowtime(st.id)}
                  >
                    {new Date(st.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn btn-primary mt-6 w-full"
              onClick={handleBuyTicket}
              disabled={!selectedShowtime}
            >
              Buy Ticket
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MovieDetail; 