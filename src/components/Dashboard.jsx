import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaUser, FaCog, FaQuestion, FaThList, FaChartBar, FaHistory, FaSignOutAlt } from 'react-icons/fa';
import { supabase } from '../Supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CHART_COLORS = ["#2563eb", "#22d3ee", "#10b981", "#f59e42", "#f44336"];

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalValue: 0
  });

  useEffect(() => {
    fetchProductos();
    fetchMovimientos();
    fetchStats();
  }, []);

  const fetchProductos = async () => {
    const { data, error } = await supabase.from('productos').select('*');
    if (error) {
      console.error('Error al obtener productos:', error.message);
    } else {
      setProductos(data);
    }
  };

  const fetchMovimientos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('historial')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error al obtener historial:', error.message);
    } else {
      setMovimientos(data);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const { data: products } = await supabase
        .from('productos')
        .select('*');

      if (products) {
        const totalValue = products.reduce((acc, product) => acc + (product.precio * product.cantidad), 0);
        const lowStock = products.filter(product => product.cantidad < 10).length;

        setStats({
          totalProducts: products.length,
          lowStock,
          totalValue
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const totalInventarios = productos.length;
  const totalStock = productos.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalRecibidos = movimientos
    .filter(m => m.tipo_movimiento === 'Ingreso')
    .reduce((acc, m) => acc + (m.cantidad || 0), 0);
  const totalEnviados = movimientos
    .filter(m => m.tipo_movimiento === 'Salida')
    .reduce((acc, m) => acc + (m.cantidad || 0), 0);
  const ultimoMovimiento = movimientos[0];

  const stockData = productos.map(p => ({
    nombre: p.nombre,
    stock: p.stock
  }));

  const movimientosData = [
    { name: 'Recibidos', value: totalRecibidos },
    { name: 'Enviados', value: totalEnviados },
  ];

  const chartData = [
    { name: 'Productos', value: stats.totalProducts },
    { name: 'Stock Bajo', value: stats.lowStock },
    { name: 'Valor Total', value: Math.round(stats.totalValue / 1000) }
  ];

  const COLORS = CHART_COLORS;

  const exportarReporteCompleto = () => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Reporte Completo de Inventario', 14, 20);

    // Resumen
    doc.setFontSize(14);
    doc.text('Resumen General', 14, 35);

    const resumen = [
      ["Total Productos", totalInventarios],
      ["Stock Total", totalStock],
      ["Recibidos", totalRecibidos],
      ["Enviados", totalEnviados]
    ];

    resumen.forEach((item, index) => {
      doc.text(`${item[0]}: ${item[1]}`, 14, 45 + index * 10);
    });

    // Productos
    doc.setFontSize(14);
    doc.text('Lista de Productos', 14, 90);

    autoTable(doc, {
      head: [["#", "Nombre", "Categoría", "Stock", "Precio", "Descripción"]],
      body: productos.map((p, index) => [
        index + 1,
        p.nombre,
        p.categoria || 'N/A',
        p.stock,
        p.precio ? `$${p.precio}` : 'N/A',
        p.descripcion || ''
      ]),
      startY: 100
    });

    let finalY = doc.lastAutoTable.finalY + 10;

    // Historial
    doc.setFontSize(14);
    doc.text('Historial de Movimientos', 14, finalY);

    autoTable(doc, {
      head: [["#", "Tipo", "Producto ID", "Fecha", "Cantidad", "Observaciones"]],
      body: movimientos.map((h, index) => [
        index + 1,
        h.tipo_movimiento,
        h.producto_id,
        new Date(h.fecha).toLocaleString(),
        h.cantidad,
        h.observaciones || ''
      ]),
      startY: finalY + 10
    });

    doc.save('reporte_inventario_completo.pdf');
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/Ges.logo.png" alt="Logo Gestora" width="64" height="64" />
        </div>
        <nav className="sidebar-nav">
          <p className="sidebar-nav-item active" onClick={() => navigate('/dashboard')}>
            <FaThList /> Dashboard
          </p>
          <p className="sidebar-nav-item" onClick={() => navigate('/productos')}>
            <FaBox /> Productos
          </p>
          <p className="sidebar-nav-item" onClick={() => navigate('/historial')}>
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
            <h1>Dashboard</h1>
          </div>

          <div className="grid">
            <div className="stats-card">
              <FaBox size={24} />
              <h3>Total Productos</h3>
              <p>{stats.totalProducts}</p>
            </div>
            <div className="stats-card">
              <FaHistory size={24} />
              <h3>Stock Bajo</h3>
              <p>{stats.lowStock}</p>
            </div>
            <div className="stats-card">
              <FaChartBar size={24} />
              <h3>Valor Total</h3>
              <p>${stats.totalValue.toLocaleString()}</p>
            </div>
          </div>

          <div className="card">
            <h2>Estadísticas Generales</h2>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#4a90e2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-center mb-4">
            <button
              onClick={exportarReporteCompleto}
              className="export-button"
            >
              📄 Descargar Reporte Completo
            </button>
          </div>

          <div style={{ display: 'flex', gap: '2rem', height: '300px' }}>
            <div className="card" style={{ flex: 1 }}>
              <h3 className="text-center">Stock por producto</h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={stockData}>
                  <XAxis dataKey="nombre" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="stock">
                    {stockData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ flex: 1 }}>
              <h3 className="text-center">Movimientos</h3>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={movimientosData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {movimientosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {ultimoMovimiento && (
            <div className="card mt-4">
              <h3>Último Movimiento:</h3>
              <p><strong>Tipo:</strong> {ultimoMovimiento.tipo_movimiento}</p>
              <p><strong>Producto ID:</strong> {ultimoMovimiento.producto_id}</p>
              <p><strong>Cantidad:</strong> {ultimoMovimiento.cantidad}</p>
              <p><strong>Fecha:</strong> {new Date(ultimoMovimiento.fecha).toLocaleString()}</p>
              <p><strong>Observaciones:</strong> {ultimoMovimiento.observaciones}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const Card = ({ title, value }) => (
  <div className="card" style={{ backgroundColor: 'var(--primary-color)', color: 'var(--text-light)', textAlign: 'center' }}>
    <h2>{value}</h2>
    <p>{title}</p>
  </div>
);

export default Dashboard;
