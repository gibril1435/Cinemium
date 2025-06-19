import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

type Movie = {
  MovieID: string;
  Title: string;
  Synopsis: string;
  Genre: string;
  Director?: string;
  ProductionHouse?: string;
  PosterURL?: string;
  Actors?: string;
  Duration?: number;
  IsActive?: boolean;
};

const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    api.get(`/movies/${id}`)
      .then(res => {
        console.log('Movie detail response:', res.data);
        setMovie(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching movie:', err);
        setError('Failed to load movie details');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="container p-4">Loading movie details...</div>;
  if (error) return <div className="container p-4 text-[var(--error)]">{error}</div>;

  return (
    <div className="container p-4">
      {movie && (
        <div className="movie-detail">
          <div className="movie-detail-poster">
            {movie.PosterURL && (
              <img src={movie.PosterURL} alt={movie.Title} className="w-full rounded-lg" />
            )}
          </div>
          <div className="movie-detail-info">
            <h1 className="movie-detail-title">{movie.Title}</h1>
            <div className="movie-detail-meta">
              <p><strong>Genre:</strong> {movie.Genre}</p>
              {movie.Director && <p><strong>Director:</strong> {movie.Director}</p>}
              {movie.ProductionHouse && <p><strong>Production House:</strong> {movie.ProductionHouse}</p>}
              {movie.Actors && (
                <p><strong>Actors:</strong> {movie.Actors}</p>
              )}
              {movie.Duration && <p><strong>Duration:</strong> {movie.Duration} minutes</p>}
            </div>
            <div className="movie-detail-description">
              <h3 className="text-lg font-semibold mb-2">Synopsis</h3>
              <p>{movie.Synopsis}</p>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Available Showtimes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Link
                  to={`/seat-order?movieId=${movie.MovieID}&showtimeId=1`}
                  className="btn btn-primary text-center"
                >
                  13:00 - Studio 1
                </Link>
                <Link
                  to={`/seat-order?movieId=${movie.MovieID}&showtimeId=2`}
                  className="btn btn-primary text-center"
                >
                  16:00 - Studio 1
                </Link>
                <Link
                  to={`/seat-order?movieId=${movie.MovieID}&showtimeId=3`}
                  className="btn btn-primary text-center"
                >
                  19:00 - Studio 1
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail; 