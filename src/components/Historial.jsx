import React, { useState, useEffect } from 'react';
import { supabase } from '../Supabase/client';
import { FaDownload, FaBox, FaThList, FaHistory } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Historial = ({ onLogout }) => {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState([]);
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMovimientos();
  }, []);

  const fetchMovimientos = async () => {
    try {
      const { data, error } = await supabase
        .from('movimientos')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;
      setMovimientos(data || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Historial de Movimientos', 14, 15);
    
    const tableColumn = ['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Usuario'];
    const tableRows = filteredMovimientos.map(mov => [
      new Date(mov.fecha).toLocaleDateString(),
      mov.tipo,
      mov.producto,
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

  const filteredMovimientos = movimientos.filter(mov => {
    const matchesFilter = filter === 'todos' || mov.tipo === filter;
    const matchesSearch = mov.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mov.usuario.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
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
              <FaDownload /> Exportar PDF
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
                  Entradas
                </button>
                <button
                  className={`btn ${filter === 'salida' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilter('salida')}
                >
                  Salidas
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
                        <span className={`badge ${mov.tipo === 'entrada' ? 'badge-success' : 'badge-danger'}`}>
                          {mov.tipo}
                        </span>
                      </td>
                      <td>{mov.producto}</td>
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
