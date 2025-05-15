import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../Supabase/client';
import { useOffline } from '../context/OfflineContext';
import './Logout.css';

const Logout = () => {
  const navigate = useNavigate();
  const { clearCache } = useOffline();

  const handleLogout = async () => {
    try {
      // Limpiar el caché antes de cerrar sesión
      clearCache();
      
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Redirigir al login
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <button className="logout-button" onClick={handleLogout}>
      Cerrar Sesión
    </button>
  );
};

export default Logout; 