import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Carica.css';
import { jwtDecode } from 'jwt-decode'; // Cambia questa importazione

const Carica = () => {
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState('');
  const [date, setDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken'); // Recupera il token dal localStorage

    if (!token) {
      console.error('Token non trovato. Devi essere loggato per caricare un post.');
      navigate('/login'); // Se il token non esiste, reindirizza al login
      return;
    }

    // Verifica la validità del token
    try {
      const decodedToken = jwtDecode(token); // Usa jwtDecode qui
      const currentTime = Date.now() / 1000; // Tempo attuale in secondi

      if (decodedToken.exp < currentTime) {
        console.error('Token scaduto. Devi effettuare il login.');
        localStorage.removeItem('authToken'); // Rimuovi il token scaduto
        navigate('/login'); // Reindirizza al login
      }
    } catch (error) {
      console.error('Errore nel decodificare il token:', error);
      localStorage.removeItem('authToken'); // Rimuovi il token invalido
      navigate('/login'); // Reindirizza al login
    }
  }, [navigate]);

  // Gestisce il caricamento dell'immagine e la ridimensiona
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      // Verifica che il file sia un'immagine
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Per favore carica un file immagine (JPEG, PNG, WebP).');
        return;
      }

      // Crea un oggetto URL per l'immagine caricata
      const img = new Image();
      img.src = URL.createObjectURL(file);

      // Aspetta che l'immagine venga caricata
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Imposta le dimensioni massime (es. 1080x1080)
        const MAX_SIZE = 1080;
        let width = img.width;
        let height = img.height;

        // Calcola le nuove dimensioni mantenendo l'aspect ratio
        if (width > height) {
          if (width > MAX_SIZE) {
            height = (height * MAX_SIZE) / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = (width * MAX_SIZE) / height;
            height = MAX_SIZE;
          }
        }

        // Ridimensiona l'immagine nel canvas
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Converte il canvas in un blob compresso
        canvas.toBlob(
          (blob) => {
            // Sostituisce l'immagine originale con quella ridimensionata
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            setImage(resizedFile); // Aggiorna lo stato con il nuovo file
          },
          file.type,
          0.8 // Qualità dell'immagine (80%)
        );
      };
    }
  };

  // Gestisce l'invio del modulo
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Controllo se il luogo è stato inserito
    if (!place) {
      alert('Il luogo è obbligatorio!');
      return;
    }

    // Controllo se la data è stata inserita
    if (!date) {
      alert('La data è obbligatoria!');
      return;
    }

    // Se l'immagine non è stata selezionata, avvisa l'utente
    if (!image) {
      alert('Per favore seleziona un\'immagine.');
      return;
    }

    // Crea il FormData per inviare al server
    const formData = new FormData();
    formData.append('image', image);
    formData.append('description', description);
    formData.append('place', place);
    formData.append('date', date); // Non includiamo più l'orario

    const token = localStorage.getItem('authToken');

    try {
      setIsUploading(true);

      // Invia la richiesta al server con il token nel header
      await axios.post('http://192.168.1.16:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      alert('Spot caricato con successo!');
      setIsUploading(false);
    } catch (error) {
      console.error('Errore durante il caricamento dello spot:', error);
      setIsUploading(false);

      // Se il token è scaduto o non valido, rimuovi il token e reindirizza al login
      if (error.response && error.response.status === 401) {
        console.error('Token non valido o scaduto.');
        localStorage.removeItem('authToken');
        navigate('/login');
      }
    }
  };

  // Funzione di logout
  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Rimuove il token
    navigate('/login'); // Reindirizza al login
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClick = (action) => {
    if (action === 'home') {
      navigate('/feed');
    } else if (action === 'carica') {
      navigate('/carica');
    } else if (action === 'profilo') {
      console.log('Vai al profilo');
    } else if (action === 'logout') {
      handleLogout(); // Chiama la funzione di logout
    }
  };

  return (
    <div className="carica-container">
      {/* Menu ad hamburger */}
      <div className="hamburger-menu" onClick={toggleMenu}>
        &#9776;
      </div>

      <div className={`slide-menu ${isMenuOpen ? 'open' : ''}`}>
        <ul>
          <li><button onClick={() => handleMenuClick('home')}>Home</button></li>
          <li><button onClick={() => handleMenuClick('carica')}>Carica Spotted</button></li>
          <li><button onClick={() => handleMenuClick('profilo')}>Profilo</button></li>
          <li><button onClick={() => handleMenuClick('logout')}>Logout</button></li>
        </ul>
      </div>

      <h2>Carica un nuovo Post</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleFileChange} required />
        <textarea
          placeholder="Aggiungi una descrizione"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
        <input
          type="text"
          placeholder="Dove?"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Caricamento in corso...' : 'Carica Spotted'}
        </button>
      </form>
    </div>
  );
};

export default Carica;
