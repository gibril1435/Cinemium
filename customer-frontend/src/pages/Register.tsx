import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Header from '../components/Header';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationNote, setValidationNote] = useState('');
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationNote('');
    if (password !== confirmPassword) {
      setValidationNote('Password dan konfirmasi password harus sama.');
      return;
    }
    try {
      await register(username, password, password); // backend should accept username, password
      navigate('/login');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message === 'Username already exists') {
        setValidationNote('Username sudah digunakan. Pilih username lain.');
      } else {
        setError('Registrasi gagal');
      }
    }
  };

  return (
    <>
      <Header />
      <div className="flex justify-center items-center min-h-screen pt-8">
        <form onSubmit={handleSubmit} className="auth-container">
          <h2 className="auth-title">Buat Akun Baru</h2>
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
          <div className="form-group">
            <label className="form-label">Ulangi Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
              className="input w-full" 
            />
          </div>
          {validationNote && <div className="text-[var(--warning)] text-sm mb-4">{validationNote}</div>}
          <div className="text-[var(--text-secondary)] text-xs mb-4">
            Username harus unik. Password dan konfirmasi password harus sama.
          </div>
          <button 
            type="submit" 
            className="btn btn-primary w-full" 
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </>
  );
};

export default Register; 