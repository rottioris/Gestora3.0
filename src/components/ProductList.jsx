import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../Supabase/client';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBox, FaThList, FaHistory, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import './ProductList.css';
import '../styles/Sidebar.css';

const ProductList = ({ onLogout }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    stock: '',
    precio: '',
    categoria_id: ''
  });
  const [showForm, setShowForm] = useState(false);
  const initialFormState = {
    nombre: '',
    stock: '',
    precio: '',
    categoria_id: ''
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      addNotification('Error al cargar los productos', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      addNotification('Error al cargar las categorías', 'error');
    }
  }, [addNotification]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        nombre: formData.nombre,
        stock: parseInt(formData.stock),
        precio: parseFloat(formData.precio),
        categoria_id: parseInt(formData.categoria_id)
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('productos')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;

        // Registrar el movimiento de actualización
        const { error: movimientoError } = await supabase
          .from('historial')
          .insert([{
            producto_id: editingProduct.id,
            tipo_movimiento: 'salida',
            cantidad: Math.abs(productData.stock - editingProduct.stock),
            observaciones: `Actualización de producto: ${productData.nombre}`
          }]);
        if (movimientoError) throw movimientoError;

        addNotification('Producto actualizado exitosamente', 'success');
      } else {
        const { data, error } = await supabase
          .from('productos')
          .insert([productData])
          .select();
        if (error) throw error;

        // Registrar el movimiento de ingreso
        const { error: movimientoError } = await supabase
          .from('historial')
          .insert([{
            producto_id: data[0].id,
            tipo_movimiento: 'entrada',
            cantidad: productData.stock,
            observaciones: `Nuevo producto agregado: ${productData.nombre}`
          }]);
        if (movimientoError) throw movimientoError;

        addNotification('Producto agregado exitosamente', 'success');
      }

      setFormData({
        nombre: '',
        stock: '',
        precio: '',
        categoria_id: ''
      });
      setEditingProduct(null);
      await fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      addNotification('Error al guardar el producto: ' + error.message, 'error');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre || '',
      stock: product.stock || '',
      precio: product.precio || '',
      categoria_id: product.categoria_id || ''
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        // Primero eliminar los registros del historial
        const { error: deleteHistorialError } = await supabase
          .from('historial')
          .delete()
          .eq('producto_id', id);
        
        if (deleteHistorialError) throw deleteHistorialError;

        // Luego eliminar el producto
        const { error: deleteError } = await supabase
          .from('productos')
          .delete()
          .eq('id', id);
        
        if (deleteError) throw deleteError;

        addNotification('Producto eliminado exitosamente', 'success');
        await fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        addNotification('Error al eliminar el producto: ' + error.message, 'error');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const filteredProducts = products.filter(product => {
    const categoria = categories.find(cat => cat.id === product.categoria_id)?.nombre || '';
    const searchLower = searchTerm.toLowerCase();
    
    // Búsqueda por nombre
    const nombreMatch = product.nombre.toLowerCase().includes(searchLower);
    
    // Búsqueda por categoría
    const categoriaMatch = categoria.toLowerCase().includes(searchLower);
    
    // Búsqueda por stock
    const stockMatch = product.stock.toString().includes(searchLower);
    
    // Búsqueda por precio
    const precioMatch = product.precio.toString().includes(searchLower);
    
    return nombreMatch || categoriaMatch || stockMatch || precioMatch;
  });

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
          <p className="sidebar-nav-item active" onClick={() => navigate('/productos')}>
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
        <div className="container">
          <div className="header">
            <h1>Gestión de Productos</h1>
            <div className="header-actions">
              <button 
                className="btn btn-primary add-product-btn" 
                onClick={() => {
                  setShowForm(true);
                  setEditingProduct(null);
                  setFormData(initialFormState);
                }}
              >
                <FaPlus /> Nuevo Producto
              </button>
            </div>
          </div>

          <div className="content-grid">
            {/* Formulario flotante */}
            {showForm && (
              <div className="floating-form">
                <div className="form-header">
                  <h2>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                  <button 
                    className="close-btn" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingProduct(null);
                      setFormData(initialFormState);
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="nombre">Nombre del Producto</label>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        className="form-input"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ingrese el nombre del producto"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="categoria">Categoría</label>
                      <select
                        id="categoria"
                        name="categoria_id"
                        className="form-input"
                        value={formData.categoria_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccione una categoría</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="stock">Stock</label>
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        className="form-input"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="Ingrese la cantidad en stock"
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="precio">Precio</label>
                      <input
                        type="number"
                        id="precio"
                        name="precio"
                        className="form-input"
                        value={formData.precio}
                        onChange={handleChange}
                        placeholder="Ingrese el precio"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      {editingProduct ? 'Actualizar' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de productos */}
            <div className="products-section">
              <div className="search-section">
                <div className="search-container">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="search-bar"
                    placeholder="Buscar por nombre, categoría, stock o precio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="search-info">
                  <span className="search-results">
                    {filteredProducts.length} productos encontrados
                  </span>
                </div>
              </div>

              <div className="table-responsive">
                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Cargando productos...</p>
                  </div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Stock</th>
                        <th>Precio</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="no-results">
                            No se encontraron productos
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((producto) => (
                          <tr key={producto.id}>
                            <td>{producto.nombre}</td>
                            <td>{producto.categoria}</td>
                            <td>
                              <span className={`stock-badge ${producto.stock < 10 ? 'low-stock' : ''}`}>
                                {producto.stock}
                              </span>
                            </td>
                            <td>${producto.precio.toLocaleString('es-CO')}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => {
                                    setEditingProduct(producto);
                                    setFormData({
                                      nombre: producto.nombre || '',
                                      stock: producto.stock || '',
                                      precio: producto.precio || '',
                                      categoria_id: producto.categoria_id || ''
                                    });
                                    setShowForm(true);
                                  }}
                                  title="Editar producto"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleDelete(producto.id)}
                                  title="Eliminar producto"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductList;
