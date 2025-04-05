import './Register.css';
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Importiamo Link se usiamo React Router.

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '', // Aggiungiamo il campo per la conferma della password
  });

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
      const response = await fetch('http://192.168.1.44:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          phone_number: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
      } else {
        alert(`Errore: ${data.message}`);
      }
    } catch (error) {
      console.error('Errore nella richiesta:', error);
      alert('Errore durante la registrazione.');
    }
  };

  return (
    <div className="register-container">
      <h2>Registrati</h2>
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
          <label>Telefono:</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
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
