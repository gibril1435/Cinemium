import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import MovieCarousel from '../components/MovieCarousel';
import { useAuth } from '../AuthContext';

// Movie type for the carousel
type CarouselMovie = {
  movieId: string;
  title: string;
  posterUrl?: string;
};

// Movie type for the grid
type Movie = {
  id: string;
  title: string;
  genre: string;
  showtimes?: string[];
  price: number;
  imageUrl: string;
  synopsis?: string;
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
  const [movies, setMovies] = useState<Movie[]>([]);
  const [carouselMovies, setCarouselMovies] = useState<CarouselMovie[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      api.get('/movies'),
      api.get('/promotions')
    ])
      .then(([moviesRes, promotionsRes]) => {
        // Transform the movies data for the grid
        const transformedMovies = (moviesRes.data || []).map((movie: any) => ({
          ...movie,
          id: movie.id || movie.movieId,
          showtimes: movie.showtimes || [],
          price: movie.price || 50000,
          imageUrl: movie.imageUrl || movie.posterUrl || '/placeholder-movie.jpg'
        }));
        
        // Transform the movies data for the carousel
        const transformedCarouselMovies = (moviesRes.data || []).map((movie: any) => ({
          movieId: movie.id || movie.movieId,
          title: movie.title,
          posterUrl: movie.posterUrl || movie.imageUrl || '/placeholder-movie.jpg'
        }));
        
        setMovies(transformedMovies);
        setCarouselMovies(transformedCarouselMovies);
        setPromotions(promotionsRes.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setError('Failed to load content');
        setLoading(false);
      });
  }, []);

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movie.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatShowtimes = (times: string[] = []) => {
    if (!times || !Array.isArray(times) || times.length === 0) {
      return 'No showtimes available';
    }
    
    return times.map(time => {
      try {
        return new Date(time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } catch (e) {
        return time;
      }
    }).join(', ');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-[400px] bg-gray-700 rounded-lg mb-8"></div>
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="aspect-[3/4] bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900/50 border border-red-500 text-red-100 px-6 py-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Carousel Section */}
      <div className="mb-8 md:mb-12 -mx-4 md:mx-0">
        <MovieCarousel 
          movies={carouselMovies} 
          promoImage={promotions[0]?.imageUrl} 
          isLoggedIn={!!user}
        />
      </div>

      {/* Search and Movies Section */}
      <div className="flex flex-col gap-4 mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
              Hi, {user?.username || user?.email || 'Guest'}!
            </h1>
            <p className="text-sm md:text-base text-gray-400">
              What movie would you like to watch today?
            </p>
          </div>
          <div className="w-full md:w-auto">
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-80 px-3 md:px-4 py-2 text-sm md:text-base bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {filteredMovies.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <p className="text-sm md:text-base text-gray-400 mb-3 md:mb-4">
            No movies found matching your search.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-sm md:text-base text-yellow-500 hover:text-yellow-400 transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          {/* Desktop View - Row of 4 movies */}
          <div className="hidden md:flex gap-6 mb-8">
            {filteredMovies.slice(0, 4).map(movie => (
              <MovieCard key={movie.id} movie={movie} onNavigate={navigate} formatShowtimes={formatShowtimes} />
            ))}
          </div>

          {/* Mobile View - Scrollable row */}
          <div className="md:hidden flex flex-nowrap gap-4 overflow-x-auto pb-6 -mx-4 px-4 snap-x snap-mandatory">
            {filteredMovies.map(movie => (
              <div key={movie.id} className="snap-start">
                <MovieCard movie={movie} onNavigate={navigate} formatShowtimes={formatShowtimes} isMobile />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// MovieCard Component for better organization
interface MovieCardProps {
  movie: Movie;
  onNavigate: (path: string) => void;
  formatShowtimes: (times?: string[]) => string;
  isMobile?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onNavigate, formatShowtimes, isMobile }) => (
  <div
    className={`group bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden hover:border-yellow-500/50 transition-all duration-300 cursor-pointer ${
      isMobile ? 'w-[280px] flex-none' : 'w-[300px] flex-none'
    }`}
    onClick={() => onNavigate(`/movie/${movie.id}`)}
    tabIndex={0}
    role="button"
    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onNavigate(`/movie/${movie.id}`); }}
  >
    <div className="aspect-[3/4] relative overflow-hidden">
      <img
        src={movie.imageUrl || '/placeholder-movie.jpg'}
        alt={movie.title}
        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
        <div className="p-4 md:p-6 w-full">
          <div className="text-xs md:text-sm text-gray-300 mb-2">
            Showtimes: {formatShowtimes(movie.showtimes)}
          </div>
        </div>
      </div>
    </div>
    <div className="p-4 md:p-6">
      <h3 className="text-base md:text-lg font-semibold mb-2 group-hover:text-yellow-500 transition-colors line-clamp-1">
        {movie.title}
      </h3>
      <div className="flex justify-between items-center">
        <span className="text-xs md:text-sm text-gray-400">{movie.genre}</span>
        <span className="text-xs md:text-sm text-yellow-500">
          Rp{movie.price.toLocaleString()}
        </span>
      </div>
    </div>
  </div>
);

export default Home; 