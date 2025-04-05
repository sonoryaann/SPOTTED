import React, { useState } from 'react';
import './Login.css'; // Creeremo questo file successivamente
import { useNavigate } from 'react-router-dom'; // Per la navigazione
import { supabase } from '../lib/supabaseClient'; // Importa il client Supabase

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Autenticazione tramite Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('Errore:', error.message);
        setError(error.message);
      } else {
        // Salva il token nel localStorage
        localStorage.setItem('authToken', data.session.access_token);
        console.log('Login riuscito');
        navigate('/feed'); // Reindirizza alla homepage o un'altra pagina
      }
    } catch (err) {
      console.error('Errore nell\'autenticazione:', err.message);
      setError('Si è verificato un errore durante il login.');
    }
  };

  return (
    <div className="login-container">
      <h2>Accedi</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Accedi</button>
      </form>
      <p>
        Non hai un account? <a href="/register">Registrati qui</a>
      </p>
    </div>
  );
};

export default Login;
