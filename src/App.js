import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './Supabase/client';
import Login from './components/Login';
import Register from './components/Register';
import ProductList from './components/ProductList';
import Dashboard from './components/Dashboard';
import Historial from './components/Historial';
import './styles/buttons.css';
import './styles/global.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <Login /> : <Navigate to="/productos" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/productos" />} />
        <Route path="/productos" element={user ? <ProductList onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route path="/dashboard" element={user ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route path="/historial" element={user ? <Historial onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
