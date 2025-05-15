import React, { useEffect, useState, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBox, FaThList, FaHistory, FaSignOutAlt, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useOffline } from '../context/OfflineContext';
import ConnectionStatus from './ConnectionStatus';
import './ProductList.css';
import '../styles/Sidebar.css';

const ITEMS_PER_PAGE = 10;

const ProductList = ({ onLogout }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { products, categories, isLoading, updateProducts } = useOffline();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    nombre: '',
    stock: '',
    precio: '',
    categoria_id: '',
    descripcion: ''
  });
  const [showForm, setShowForm] = useState(false);
  const initialFormState = {
    nombre: '',
    stock: '',
    precio: '',
    categoria_id: '',
    descripcion: ''
  };

  // Memoizar los productos filtrados para evitar recálculos innecesarios
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;

    const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/);
    
    return products.filter(product => {
      // Caso especial para búsqueda de stock 0
      if (searchTerm.trim() === '0') {
        return product.stock === 0;
      }

      const categoria = categories.find(cat => cat.id === product.categoria_id)?.nombre || '';
      const productValues = [
        product.nombre.toLowerCase(),
        categoria.toLowerCase(),
        product.stock.toString(),
        product.precio.toString(),
        (product.descripcion || '').toLowerCase()
      ];

      // Verificar si todos los términos de búsqueda están presentes en algún valor del producto
      return searchTerms.every(term => 
        productValues.some(value => value.includes(term))
      );
    });
  }, [products, categories, searchTerm]);

  // Calcular productos paginados
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // Resetear la página cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // Modo edición
        const updatedProduct = {
          ...editingProduct,
          nombre: formData.nombre,
          categoria_id: parseInt(formData.categoria_id),
          stock: parseInt(formData.stock),
          precio: parseFloat(formData.precio),
          descripcion: formData.descripcion
        };

        const updatedProducts = products.map(product => 
          product.id === editingProduct.id ? updatedProduct : product
        );
        await updateProducts(updatedProducts);
        addNotification('Producto actualizado exitosamente', 'success');
      } else {
        // Modo creación
        const newProduct = {
          id: Math.floor(Math.random() * 1000), // ID más pequeño
          nombre: formData.nombre,
          categoria_id: parseInt(formData.categoria_id),
          stock: parseInt(formData.stock),
          precio: parseFloat(formData.precio),
          descripcion: formData.descripcion
        };

        const updatedProducts = [...products, newProduct];
        await updateProducts(updatedProducts);
        addNotification('Producto agregado exitosamente', 'success');
      }

      setFormData(initialFormState);
      setEditingProduct(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      addNotification('Error al guardar el producto. Por favor, intente nuevamente.', 'error');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre || '',
      stock: product.stock || '',
      precio: product.precio || '',
      categoria_id: product.categoria_id || '',
      descripcion: product.descripcion || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        const updatedProducts = products.filter(product => product.id !== id);
        await updateProducts(updatedProducts);
        addNotification('Producto eliminado exitosamente', 'success');
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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const truncateDescription = (text, maxWords = 30) => {
    if (!text) return '-';
    const words = text.split(' ');
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(' ') + '...';
    }
    return text;
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
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
            <ConnectionStatus />

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
                    <div className="form-group full-width">
                      <label htmlFor="descripcion">Descripción</label>
                      <textarea
                        id="descripcion"
                        name="descripcion"
                        className="form-input"
                        value={formData.descripcion}
                        onChange={handleChange}
                        placeholder="Ingrese una descripción del producto"
                        rows="3"
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
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Stock</th>
                      <th>Precio</th>
                      <th className="description-column">Descripción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="no-results">
                          No se encontraron productos
                        </td>
                      </tr>
                    ) : (
                      paginatedProducts.map((producto) => (
                        <tr key={producto.id}>
                          <td>{producto.nombre}</td>
                          <td>
                            {categories.find(cat => cat.id === producto.categoria_id)?.nombre || 'Sin categoría'}
                          </td>
                          <td>
                            <span className={`stock-badge ${producto.stock < 10 ? 'low-stock' : ''}`}>
                              {producto.stock}
                            </span>
                          </td>
                          <td>${producto.precio.toLocaleString('es-CO')}</td>
                          <td className="description-column" title={producto.descripcion || '-'}>
                            {truncateDescription(producto.descripcion)}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleEdit(producto)}
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
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft /> Anterior
                  </button>
                  <span className="page-info">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente <FaChevronRight />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductList;
