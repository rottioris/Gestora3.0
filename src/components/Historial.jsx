import React, { useState, useEffect, useMemo } from 'react';
import { FaSearch, FaThList, FaBox, FaHistory, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useOffline } from '../context/OfflineContext';
import ConnectionStatus from './ConnectionStatus';
import './Historial.css';
import '../styles/Sidebar.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Historial = ({ onLogout }) => {
  const navigate = useNavigate();
  const { historial, isLoading, isOnline } = useOffline();
  const [searchTerm, setSearchTerm] = useState('');

  // Usar useMemo para filtrar el historial
  const filteredHistorial = useMemo(() => {
    if (!historial) return [];
    
    const searchLower = searchTerm.toLowerCase();
    return historial.filter(entry => {
      const fecha = new Date(entry.fecha).toLocaleString().toLowerCase();
      const tipo = entry.tipo_movimiento.toLowerCase();
      const cantidad = entry.cantidad.toString();
      const observaciones = (entry.observaciones || '').toLowerCase();

      return (
        fecha.includes(searchLower) ||
        tipo.includes(searchLower) ||
        cantidad.includes(searchLower) ||
        observaciones.includes(searchLower)
      );
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Ordenar por fecha más reciente
  }, [historial, searchTerm]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Historial de Movimientos', 14, 15);
    
    const tableColumn = ['Fecha', 'Tipo', 'Cantidad', 'Observaciones'];
    const tableRows = filteredHistorial.map(mov => [
      new Date(mov.fecha).toLocaleString(),
      mov.tipo_movimiento,
      mov.cantidad,
      mov.observaciones || '-'
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

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          <div className="header">
            <h1>Historial de Movimientos</h1>
            <button className="btn btn-secondary" onClick={exportToPDF}>
              <FaSearch /> Exportar PDF
            </button>
          </div>

          <div className="content-grid">
            <ConnectionStatus />

            <div className="historial-section">
              <div className="search-section">
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
                <div className="search-info">
                  <span className="search-results">
                    {filteredHistorial.length} resultados encontrados
                  </span>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistorial.length > 0 ? (
                      filteredHistorial.map((entry) => (
                        <tr key={entry.id}>
                          <td>{new Date(entry.fecha).toLocaleString()}</td>
                          <td>
                            <span className={`movement-type ${entry.tipo_movimiento.toLowerCase()}`}>
                              {entry.tipo_movimiento}
                            </span>
                          </td>
                          <td>{entry.cantidad}</td>
                          <td>{entry.observaciones || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="no-results">
                          No se encontraron movimientos
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Historial;
