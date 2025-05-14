import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaThList, FaChartBar, FaHistory, FaBell, FaFileExport, FaArrowUp, FaSignOutAlt } from 'react-icons/fa';
import { supabase } from '../Supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNotification } from '../context/NotificationContext';
import './Dashboard.css';
import '../styles/Sidebar.css';

const CHART_COLORS = ["#2563eb", "#22d3ee", "#10b981", "#f59e42", "#f44336"];

// Función para formatear moneda en pesos colombianos
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [stats, setStats] = useState({
    totalProductos: 0,
    stockBajo: 0,
    sinStock: 0,
    valorTotal: 0
  });
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);

  const fetchMovimientos = useCallback(async () => {
    const { data, error } = await supabase
      .from('historial')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error al obtener historial:', error.message);
    } else {
      setMovimientos(data);
    }
  }, []);

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setProductos(data || []);

      // Verificar productos con bajo stock
      const productosBajoStock = data.filter(p => p.stock < 10);
      productosBajoStock.forEach(producto => {
        addNotification(
          `Producto "${producto.nombre}" con bajo stock (${producto.stock} unidades)`,
          'warning',
          producto.id
        );
      });
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data: productos, error } = await supabase
        .from('productos')
        .select('*');

      if (error) throw error;

      // Calcular estadísticas
      const totalProductos = productos.length;
      const stockBajo = productos.filter(p => p.stock < 10 && p.stock > 0).length;
      const sinStock = productos.filter(p => p.stock === 0).length;
      const valorTotal = productos.reduce((sum, p) => sum + (p.precio * p.stock), 0);

      setStats({
        totalProductos,
        stockBajo,
        sinStock,
        valorTotal
      });

      // Notificar sobre stock bajo
      if (stockBajo > 0) {
        addNotification(`${stockBajo} productos con stock bajo`, 'warning');
      }
      if (sinStock > 0) {
        addNotification(`${sinStock} productos sin stock`, 'error');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      addNotification('Error al cargar las estadísticas', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchProductos();
    fetchMovimientos();
    fetchStats();
  }, [fetchProductos, fetchMovimientos, fetchStats]);

  const handleNotificationClick = () => {
    let mensaje = '';
    if (stats.stockBajo > 0) {
      mensaje += `⚠️ ${stats.stockBajo} productos con stock bajo\n`;
    }
    if (stats.sinStock > 0) {
      mensaje += `❌ ${stats.sinStock} productos sin stock`;
    }
    
    if (mensaje) {
      addNotification(mensaje, 'info');
    } else {
      addNotification('✅ Todo el stock está en orden', 'success');
    }
  };

  const exportarReporteCompleto = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte Completo de Inventario', 14, 20);

    doc.setFontSize(14);
    doc.text('Resumen General', 14, 35);

    const resumen = [
      ["Total Productos", stats.totalProductos],
      ["Stock Bajo", stats.stockBajo],
      ["Sin Stock", stats.sinStock],
      ["Valor Total", formatCurrency(stats.valorTotal)]
    ];

    resumen.forEach((item, index) => {
      doc.text(`${item[0]}: ${item[1]}`, 14, 45 + index * 10);
    });

    doc.setFontSize(14);
    doc.text('Lista de Productos', 14, 90);

    autoTable(doc, {
      head: [["#", "Nombre", "Categoría", "Stock", "Precio", "Valor Total", "Descripción"]],
      body: productos.map((p, index) => [
        index + 1,
        p.nombre,
        p.categoria || 'N/A',
        p.stock,
        p.precio ? formatCurrency(p.precio) : 'N/A',
        p.precio ? formatCurrency(p.precio * p.stock) : 'N/A',
        p.descripcion || ''
      ]),
      startY: 100
    });

    let finalY = doc.lastAutoTable.finalY + 10;

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

  // Datos para las gráficas
  const stockData = productos
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5)
    .map(p => ({
      nombre: p.nombre,
      stock: p.stock,
      valor: p.precio * p.stock
    }));

  const movimientosData = [
    { name: 'Recibidos', value: movimientos.filter(m => m.tipo_movimiento === 'Ingreso').length },
    { name: 'Enviados', value: movimientos.filter(m => m.tipo_movimiento === 'Salida').length },
  ];

  const chartData = [
    { name: 'Productos', value: stats.totalProductos },
    { name: 'Stock Bajo', value: stats.stockBajo },
    { name: 'Sin Stock', value: stats.sinStock }
  ];

  // Datos para la gráfica de tendencias
  const tendenciasData = productos
    .filter(p => p.stock > 0)
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5)
    .map(p => ({
      nombre: p.nombre,
      stock: p.stock,
      valor: p.precio * p.stock
    }));

  // Custom tooltip para las gráficas
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Valor') ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/Ges.logo.png" alt="Logo Gestora" width="64" height="64" />
        </div>
        <nav className="sidebar-nav">
          <p className="sidebar-nav-item active" onClick={() => navigate('/dashboard')}>
            <FaThList /> <span>Dashboard</span>
          </p>
          <p className="sidebar-nav-item" onClick={() => navigate('/productos')}>
            <FaBox /> <span>Productos</span>
          </p>
          <p className="sidebar-nav-item" onClick={() => navigate('/historial')}>
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
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1 className="dashboard-title">Dashboard</h1>
            <div className="dashboard-actions">
              <button className="notification-button" onClick={handleNotificationClick}>
                <FaBell />
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stats-card">
              <div className="stats-icon primary">
                <FaBox />
              </div>
              <div className="stats-info">
                <div className="stats-label">Total Productos</div>
                <div className="stats-value">{stats.totalProductos}</div>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-icon warning">
                <FaChartBar />
              </div>
              <div className="stats-info">
                <div className="stats-label">Stock Bajo</div>
                <div className="stats-value">{stats.stockBajo}</div>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-icon danger">
                <FaHistory />
              </div>
              <div className="stats-info">
                <div className="stats-label">Sin Stock</div>
                <div className="stats-value">{stats.sinStock}</div>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-icon success">
                <FaArrowUp />
              </div>
              <div className="stats-info">
                <div className="stats-label">Valor Total</div>
                <div className="stats-value">{formatCurrency(stats.valorTotal)}</div>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <h2 className="chart-title">Top 5 Productos por Stock</h2>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" />
                    <YAxis yAxisId="left" orientation="left" stroke="#2563eb" />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="stock" name="Stock" fill="#2563eb" />
                    <Bar yAxisId="right" dataKey="valor" name="Valor Total" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h2 className="chart-title">Distribución de Movimientos</h2>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={movimientosData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {movimientosData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <h2 className="chart-title">Tendencias de Stock</h2>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tendenciasData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" />
                    <YAxis yAxisId="left" orientation="left" stroke="#2563eb" />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="stock" name="Stock" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                    <Area yAxisId="right" type="monotone" dataKey="valor" name="Valor Total" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h2 className="chart-title">Estado General</h2>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="value" fill="#4a90e2">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <button onClick={exportarReporteCompleto} className="export-button">
            <FaFileExport /> Descargar Reporte Completo
          </button>

          {movimientos[0] && (
            <div className="last-movement-card">
              <div className="last-movement-header">
                <h2 className="last-movement-title">Último Movimiento</h2>
              </div>
              <div className="last-movement-content">
                <div className="movement-item">
                  <div className="movement-label">Tipo</div>
                  <div className="movement-value">{movimientos[0].tipo_movimiento}</div>
                </div>
                <div className="movement-item">
                  <div className="movement-label">Producto ID</div>
                  <div className="movement-value">{movimientos[0].producto_id}</div>
                </div>
                <div className="movement-item">
                  <div className="movement-label">Cantidad</div>
                  <div className="movement-value">{movimientos[0].cantidad}</div>
                </div>
                <div className="movement-item">
                  <div className="movement-label">Fecha</div>
                  <div className="movement-value">{new Date(movimientos[0].fecha).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
