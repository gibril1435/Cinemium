import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../AuthContext';
import MovieCarousel from '../components/MovieCarousel';

type Movie = {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  posterUrl?: string;
};

type Promotion = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
};

const Home: React.FC = () => {
  const { user } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/movies'),
      api.get('/promotions')
    ])
      .then(([moviesRes, promotionsRes]) => {
        setMovies(moviesRes.data);
        setPromotions(promotionsRes.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load content');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="container p-4">Loading...</div>;
  if (error) return <div className="container p-4 text-[var(--error)]">{error}</div>;

  // Filter movies by search
  const filteredMovies = movies.filter(movie => movie.title.toLowerCase().includes(search.toLowerCase()));
  // Example promo image (replace with real one if available)
  const promoImage = 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=600&q=80';

  return (
    <>
      <Header />
      {user && <div className="container p-4 text-lg">Hi, {user.username}!</div>}
      <div className="container">
        <MovieCarousel movies={movies} promotions={promotions} isLoggedIn={!!user} />
        <div className="mb-6">
          <input
            type="text"
            placeholder="Cari film..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input w-full"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredMovies.map(movie => (
            <div key={movie.id} className="movie-card">
              {movie.posterUrl && <img src={movie.posterUrl} alt={movie.title} className="movie-poster" />}
              <div className="movie-info">
                <h2 className="movie-title">{movie.title}</h2>
                <p className="text-[var(--text-secondary)] mb-1">{movie.genre}</p>
                <p className="text-[var(--text-secondary)] text-sm mb-1">Jam Tayang: 13:00, 16:00, 19:00</p>
                <p className="text-[var(--success)] font-bold mb-2">Harga: Rp50.000</p>
                <Link to={`/movie/${movie.id}`} className="btn btn-primary w-full text-center">View Details</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Home; 