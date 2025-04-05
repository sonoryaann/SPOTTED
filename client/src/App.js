import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Feed from './components/Feed/Feed';  // Componente Feed
import Carica from './components/Carica/Carica';  // Componente Carica
import Register from './components/Register/Register';
import Login from './components/Login/Login';
import { supabase } from './lib/supabaseClient';  // Importa il client Supabase

const App = () => {
  const [user, setUser] = useState(null);

  // Controlla lo stato di autenticazione dell'utente all'avvio
  useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data }) => {
      setUser(data?.user); // Imposta l'utente se la sessione è attiva
    });

    // Aggiungi un listener per i cambiamenti di sessione
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user);  // Aggiorna lo stato dell'utente quando cambia lo stato di autenticazione
    });

    return () => {
      authListener?.unsubscribe();  // Pulisce il listener quando il componente è smontato
    };
  }, []);

  // Componente protetto per le rotte che richiedono autenticazione
  const ProtectedRoute = ({ element }) => {
    return user ? element : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        {/* Rotte protette */}
        <Route path="/feed" element={<ProtectedRoute element={<Feed />} />} />
        <Route path="/carica" element={<ProtectedRoute element={<Carica />} />} />

        {/* Rotte non protette */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;
