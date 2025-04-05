import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Feed from './components/Feed/Feed';  // Componente Feed
import Carica from './components/Carica/Carica';  // Componente Carica
import Register from './components/Register/Register';
import Login from './components/Login/Login';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/feed" element={<Feed />} />  {/* Mostra il feed a /feed */}
        <Route path="/carica" element={<Carica />} />  {/* Pagina di caricamento a /carica */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;
