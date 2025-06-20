import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

type Movie = {
  movieId: string;
  title: string;
  synopsis: string;
  genre: string;
  director?: string;
  productionHouse?: string;
  posterUrl?: string;
  actors?: string;
  duration?: number;
  isActive?: boolean;
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          {/* Hero section skeleton */}
          <div className="h-[400px] bg-gray-800 rounded-lg mb-8"></div>
          
          {/* Content skeleton */}
          <div className="max-w-4xl mx-auto">
            <div className="h-8 bg-gray-800 w-3/4 rounded mb-4"></div>
            <div className="space-y-2 mb-6">
              <div className="h-4 bg-gray-800 w-1/4 rounded"></div>
              <div className="h-4 bg-gray-800 w-1/3 rounded"></div>
              <div className="h-4 bg-gray-800 w-1/2 rounded"></div>
            </div>
            <div className="h-32 bg-gray-800 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-12 bg-gray-800 rounded"></div>
              <div className="h-12 bg-gray-800 rounded"></div>
              <div className="h-12 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/50 border border-red-500 text-red-100 px-6 py-4 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {movie && (
        <>
          {/* Hero Section */}
          <div className="relative h-[400px] md:h-[500px] mb-8">
            {/* Backdrop Image */}
            <div className="absolute inset-0 overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center blur-sm"
                style={{ 
                  backgroundImage: `url(${movie.posterUrl})`,
                  transform: 'scale(1.1)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/30" />
            </div>
            
            {/* Content */}
            <div className="container mx-auto px-4 relative h-full">
              <div className="flex flex-col md:flex-row items-end h-full pb-8 gap-6 md:gap-8">
                {/* Poster */}
                <div className="w-48 md:w-64 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl">
                  <img 
                    src={movie.posterUrl} 
                    alt={movie.title} 
                    className="w-full h-auto"
                  />
                </div>
                
                {/* Movie Info */}
                <div className="flex-grow">
                  <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">
                    {movie.title}
                  </h1>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm md:text-base text-gray-300 mb-4">
                    {movie.genre && (
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        {movie.genre}
                      </div>
                    )}
                    {movie.duration && (
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        {movie.duration} minutes
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 pb-12">
            <div className="max-w-4xl mx-auto">
              {/* Movie Details */}
              <div className="grid md:grid-cols-[1fr,auto] gap-8 mb-8">
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-white">About the Movie</h2>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    {movie.synopsis}
                  </p>
                  
                  <div className="space-y-3 text-sm">
                    {movie.director && (
                      <div className="flex">
                        <span className="text-gray-400 w-32">Director</span>
                        <span className="text-white">{movie.director}</span>
                      </div>
                    )}
                    {movie.productionHouse && (
                      <div className="flex">
                        <span className="text-gray-400 w-32">Production</span>
                        <span className="text-white">{movie.productionHouse}</span>
                      </div>
                    )}
                    {movie.actors && (
                      <div className="flex">
                        <span className="text-gray-400 w-32">Cast</span>
                        <span className="text-white">{movie.actors}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Showtimes Section */}
                <div className="w-full md:w-72">
                  <h2 className="text-xl font-semibold mb-4 text-white">Available Shows</h2>
                  <div className="space-y-3">
                    <Link
                      to={`/seat-order?movieId=${movie.movieId}&showtimeId=1`}
                      className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
                    >
                      <div>
                        <div className="text-white font-medium group-hover:text-yellow-500 transition-colors">13:00</div>
                        <div className="text-sm text-gray-400">Studio 1</div>
                      </div>
                      <div className="text-sm text-yellow-500">Book Now</div>
                    </Link>
                    
                    <Link
                      to={`/seat-order?movieId=${movie.movieId}&showtimeId=2`}
                      className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
                    >
                      <div>
                        <div className="text-white font-medium group-hover:text-yellow-500 transition-colors">16:00</div>
                        <div className="text-sm text-gray-400">Studio 1</div>
                      </div>
                      <div className="text-sm text-yellow-500">Book Now</div>
                    </Link>
                    
                    <Link
                      to={`/seat-order?movieId=${movie.movieId}&showtimeId=3`}
                      className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
                    >
                      <div>
                        <div className="text-white font-medium group-hover:text-yellow-500 transition-colors">19:00</div>
                        <div className="text-sm text-gray-400">Studio 1</div>
                      </div>
                      <div className="text-sm text-yellow-500">Book Now</div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MovieDetail; 