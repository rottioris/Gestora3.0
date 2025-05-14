import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaThList, FaHistory, FaSignOutAlt, FaSearch } from 'react-icons/fa';
import { supabase } from '../Supabase/client';
import { useNotification } from '../context/NotificationContext';
import './History.css';
import '../styles/Sidebar.css';

const History = () => {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchMovimientos();
    fetchProductos();
  }, []);

  const fetchMovimientos = async () => {
    try {
      const { data, error } = await supabase
        .from('historial')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;
      setMovimientos(data || []);
    } catch (error) {
      console.error('Error al obtener historial:', error);
      addNotification('Error al cargar el historial', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*');

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error al obtener productos:', error);
    }
  };

  const getProductoNombre = (productoId) => {
    const producto = productos.find(p => p.id === productoId);
    return producto ? producto.nombre : 'Producto no encontrado';
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMovimientos = movimientos.filter(movimiento => {
    const productoNombre = getProductoNombre(movimiento.producto_id).toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return (
      productoNombre.includes(searchLower) ||
      movimiento.tipo_movimiento.toLowerCase().includes(searchLower) ||
      movimiento.observaciones?.toLowerCase().includes(searchLower)
    );
  });

  const onLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Error al cerrar sesión:', err.message);
    }
  };

  if (loading) {
    return <div className="loading">Cargando historial...</div>;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/Ges.logo.png" alt="Logo Gestora" width="64" height="64" />
        </div>
        <nav className="sidebar-nav">
          <p className="sidebar-nav-item" onClick={() => navigate('/dashboard')}>
            <FaThList /> <span>Dashboard</span>
          </p>
          <p className="sidebar-nav-item" onClick={() => navigate('/productos')}>
            <FaBox /> <span>Productos</span>
          </p>
          <p className="sidebar-nav-item active" onClick={() => navigate('/historial')}>
            <FaHistory /> <span>Historial</span>
          </p>
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-logout" onClick={onLogout}>
            <span>
              <FaSignOutAlt /> Cerrar sesión
            </span>
          </p>
        </div>
      </aside>

      <main className="main-content">
        <div className="container">
          <div className="header">
            <h1>Historial de Movimientos</h1>
          </div>

          <div className="card">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-bar"
                placeholder="Buscar en el historial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovimientos.map((movimiento) => (
                    <tr key={movimiento.id}>
                      <td>{formatFecha(movimiento.fecha)}</td>
                      <td>
                        <span className={`movement-type ${movimiento.tipo_movimiento.toLowerCase()}`}>
                          {movimiento.tipo_movimiento}
                        </span>
                      </td>
                      <td>{getProductoNombre(movimiento.producto_id)}</td>
                      <td>{movimiento.cantidad}</td>
                      <td>{movimiento.observaciones || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default History; 