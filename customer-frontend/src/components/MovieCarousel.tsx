import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import { Autoplay } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';

interface Movie {
  movieId: string;
  title: string;
  posterUrl?: string;
}

interface MovieCarouselProps {
  movies: Movie[];
  promoImage: string;
  isLoggedIn: boolean;
}

const MovieCarousel: React.FC<MovieCarouselProps> = ({ movies, promoImage }) => {
  const navigate = useNavigate();

  // Show top 3 movies + 1 promo
  const slides = [
    ...movies.slice(0, 3).map(movie => ({
      type: 'movie' as const,
      ...movie,
    })),
    { type: 'promo' as const, posterUrl: promoImage },
  ];

  const handleClick = (slide: typeof slides[0]) => {
    if (slide.type === 'movie') {
      navigate(`/movie/${slide.movieId}`);
    }
  };

  return (
    <Swiper
      modules={[Autoplay]}
      autoplay={{ delay: 4000, disableOnInteraction: false }}
      loop
      className="w-full h-[200px] sm:h-[300px] md:h-[400px] rounded-none md:rounded-lg overflow-hidden"
    >
      {slides.map((slide, idx) => (
        <SwiperSlide key={idx}>
          <div 
            className={`relative w-full h-full ${slide.type === 'movie' ? 'cursor-pointer' : ''}`}
            onClick={() => handleClick(slide)}
          >
            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />
            
            {/* Image */}
            <img
              src={slide.posterUrl}
              alt={slide.type === 'movie' ? slide.title : 'Promo'}
              className="w-full h-full object-cover"
            />

            {/* Content */}
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-8 z-20">
              <div className="container mx-auto">
                {slide.type === 'movie' ? (
                  <div className="max-w-3xl">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 md:mb-4 line-clamp-2">
                      {slide.title}
                    </h2>
                    <div className="hidden md:block text-sm text-gray-300 mb-4 line-clamp-2">
                      Click to view movie details and showtimes
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      Special Promotion!
                    </h2>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default MovieCarousel; 