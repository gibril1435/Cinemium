import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import { Autoplay } from 'swiper/modules';
import { Link } from 'react-router-dom';

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

const MovieCarousel: React.FC<MovieCarouselProps> = ({ movies, promoImage, isLoggedIn }) => {
  // Show top 3 movies + 1 promo
  const slides = [
    ...movies.slice(0, 3).map(movie => ({
      type: 'movie' as const,
      ...movie,
    })),
    { type: 'promo' as const, posterUrl: promoImage },
  ];

  return (
    <Swiper
      modules={[Autoplay]}
      autoplay={{ delay: 4000, disableOnInteraction: false }}
      loop
      className="carousel w-full h-72 mb-6"
    >
      {slides.map((slide, idx) => (
        <SwiperSlide key={idx} className="carousel-item">
          <div className="flex flex-col items-center justify-center h-72 bg-[var(--secondary)] rounded-lg relative">
            <img
              src={slide.type === 'movie' ? slide.posterUrl : slide.posterUrl}
              alt={slide.type === 'movie' ? slide.title : 'Promo'}
              className="movie-poster h-56 rounded shadow mb-2"
            />
            {slide.type === 'movie' ? (
              <>
                <div className="movie-title text-xl mb-2">{slide.title}</div>
                <Link
                  to={isLoggedIn ? `/movie/${slide.movieId}` : '/login'}
                  className="btn btn-primary"
                >
                  Beli Tiket
                </Link>
              </>
            ) : (
              <div className="text-[var(--text-primary)] text-lg font-bold mt-2">Promo Spesial!</div>
            )}
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default MovieCarousel; 