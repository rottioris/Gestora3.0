import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../Supabase/client';
import { FaBox, FaThList, FaHistory, FaSignOutAlt, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import './Historial.css';
import '../styles/Sidebar.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Historial = ({ onLogout }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [movimientos, setMovimientos] = useState([]);
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMovimientos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('historial')
        .select(`
          *,
          productos (
            nombre,
            categoria_id,
            categorias (
              nombre
            )
          )
        `)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setMovimientos(data || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
      addNotification('Error al cargar el historial', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchMovimientos();
  }, [fetchMovimientos]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Historial de Movimientos', 14, 15);
    
    const tableColumn = ['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Usuario'];
    const tableRows = filteredMovimientos.map(mov => [
      new Date(mov.fecha).toLocaleDateString(),
      mov.tipo_movimiento,
      mov.productos?.nombre,
      mov.cantidad,
      mov.usuario
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [74, 144, 226] }
    });

    doc.save('historial_movimientos.pdf');
  };

  const filteredMovimientos = movimientos.filter(movimiento => {
    const searchLower = searchTerm.toLowerCase();
    return (
      movimiento.productos?.nombre.toLowerCase().includes(searchLower) ||
      movimiento.tipo_movimiento.toLowerCase().includes(searchLower) ||
      movimiento.observaciones.toLowerCase().includes(searchLower) ||
      movimiento.cantidad.toString().includes(searchLower)
    );
  });

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/Ges.logo.png" alt="Logo Gestora" width="64" height="64" />
        </div>
        <nav className="sidebar-nav">
          <p className="sidebar-nav-item" onClick={() => navigate('/dashboard')}>
            <FaThList /> Dashboard
          </p>
          <p className="sidebar-nav-item" onClick={() => navigate('/productos')}>
            <FaBox /> Productos
          </p>
          <p className="sidebar-nav-item active" onClick={() => navigate('/historial')}>
            <FaHistory /> Historial
          </p>
        </nav>
        <div className="sidebar-footer">
          <p className="logout-button sidebar-logout" onClick={onLogout}>
            🔓 Cerrar sesión
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          <div className="header">
            <h1>Historial de Movimientos</h1>
            <button className="btn btn-secondary" onClick={exportToPDF}>
              <FaSearch /> Exportar PDF
            </button>
          </div>

          <div className="card">
            <div className="filters-container">
              <div className="search-container">
                <input
                  type="text"
                  className="search-bar"
                  placeholder="Buscar en historial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-buttons">
                <button
                  className={`btn ${filter === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilter('todos')}
                >
                  Todos
                </button>
                <button
                  className={`btn ${filter === 'entrada' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilter('entrada')}
                >
                  <span role="img" aria-label="entrada">📥</span> Entradas
                </button>
                <button
                  className={`btn ${filter === 'salida' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilter('salida')}
                >
                  <span role="img" aria-label="salida">📤</span> Salidas
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovimientos.map((mov) => (
                    <tr key={mov.id}>
                      <td>{new Date(mov.fecha).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${mov.tipo_movimiento === 'entrada' ? 'badge-success' : 'badge-danger'}`}>
                          {mov.tipo_movimiento}
                        </span>
                      </td>
                      <td>{mov.productos?.nombre}</td>
                      <td>{mov.cantidad}</td>
                      <td>{mov.usuario}</td>
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

export default Historial;
