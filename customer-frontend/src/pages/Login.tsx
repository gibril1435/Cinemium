import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Header from '../components/Header';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();

  // Check if redirected from Buy Ticket (e.g., via state or query param)
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get('redirectTo');
  const seatOrderParams = params.get('seatOrderParams');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
      if (redirectTo === 'seat-order' && seatOrderParams) {
        navigate(`/seat-order?${seatOrderParams}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Username atau password salah');
    }
  };

  return (
    <>
      <Header />
      <div className="flex justify-center items-center min-h-screen pt-8">
        <form onSubmit={handleSubmit} className="auth-container">
          <h2 className="auth-title">Login ke Akun</h2>
          {error && <div className="text-[var(--error)] mb-4">{error}</div>}
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              className="input w-full" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="input w-full" 
            />
          </div>
          <div className="text-[var(--text-secondary)] text-xs mb-4">
            Masukkan username dan password Anda untuk login.
          </div>
          <button 
            type="submit" 
            className="btn btn-primary w-full" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <div className="mt-4 text-center">
            <Link to="/register" className="auth-link">Buat Akun Sekarang</Link>
          </div>
        </form>
      </div>
    </>
  );
};

export default Login; 