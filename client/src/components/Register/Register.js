import './Register.css';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importiamo Link e useNavigate da React Router.
import supabase from '../../lib/supabaseClient';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '', // Aggiungiamo il campo per la conferma della password
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verifica che le password siano uguali
    if (formData.password !== formData.confirmPassword) {
      alert('Le password non corrispondono!');
      return;
    }

    try {
      // Registrazione tramite Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      // Logga i dati di risposta per aiutare nel debug
      console.log('Data:', data);
      console.log('Error:', error);

      if (error) {
        console.error('Errore:', error.message);
        setError(error.message);
      } else {
        // Se non ci sono errori, tentiamo anche di fare il login
        const { user, session, error: loginError } = await supabase.auth.signIn({
          email: formData.email,
          password: formData.password,
        });

        if (loginError) {
          console.error('Errore durante il login:', loginError.message);
          setError(loginError.message);
        } else {
          // Salva il token nel localStorage (opzionale, se lo usi per sessione)
          localStorage.setItem('authToken', session.access_token);
          alert('Registrazione avvenuta con successo!');
          navigate('/feed'); // Reindirizza alla pagina feed
        }
      }
    } catch (err) {
      console.error('Errore nella registrazione:', err.message);
      setError('Si è verificato un errore durante la registrazione.');
    }
  };

  return (
    <div className="register-container">
      <h2>Registrati</h2>
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
        <div>
          <label>Conferma Password:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Registrati</button>
      </form>
      <p className="login-link">
        Hai già un account? <Link to="/login">Accedi qui</Link>
      </p>
    </div>
  );
};

export default Register;
