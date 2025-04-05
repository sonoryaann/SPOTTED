import React, { useState } from 'react';
import './Login.css'; // Creeremo questo file successivamente
import { useNavigate } from 'react-router-dom'; // Per la navigazione

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
        const response = await fetch('http://192.168.1.16:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
            // Salva il token nel localStorage
            localStorage.setItem('authToken', data.token);
            console.log('Login riuscito:', data.message);
            navigate('/feed'); // Reindirizza alla homepage o un'altra pagina
        } else {
            console.error('Errore:', data.message);
            setError(data.message);
        }
    } catch (err) {
        console.error('Errore nella richiesta:', err.message);
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
