import React, { useEffect, useState } from 'react';
import { supabase } from '../Supabase/client';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBox, FaThList, FaHistory } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ProductList = ({ onLogout }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    stock: '',
    precio: '',
    categoria_id: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

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
      } else {
        const { error } = await supabase
          .from('productos')
          .insert([productData]);
        if (error) throw error;
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
      alert('Error al guardar el producto: ' + error.message);
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
        const { data: movimientos, error: movimientosError } = await supabase
          .from('historial')
          .select('id')
          .eq('producto_id', id);
        if (movimientosError) throw movimientosError;
        if (movimientos && movimientos.length > 0) {
          const { error: deleteMovimientosError } = await supabase
            .from('historial')
            .delete()
            .eq('producto_id', id);
          if (deleteMovimientosError) throw deleteMovimientosError;
        }
        const { error: deleteError } = await supabase
          .from('productos')
          .delete()
          .eq('id', id);
        if (deleteError) throw deleteError;
        await fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('No se pudo eliminar el producto. Puede que tenga movimientos asociados.');
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const categoria = categories.find(cat => cat.id === product.categoria_id)?.nombre || '';
    return (
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoria.toLowerCase().includes(searchTerm.toLowerCase())
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
          <p className="sidebar-nav-item active" onClick={() => navigate('/productos')}>
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
            <h1>Gestión de Productos</h1>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  placeholder="Stock"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <select
                  value={formData.categoria_id}
                  onChange={e => setFormData({ ...formData, categoria_id: e.target.value })}
                  required
                  className="form-input"
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">
                {editingProduct ? <FaEdit /> : <FaPlus />} {editingProduct ? 'Actualizar' : 'Agregar'} Producto
              </button>
            </form>
          </div>

          <div className="card">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-bar"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Stock</th>
                    <th>Precio</th>
                    <th>Categoría</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const categoria = categories.find(cat => cat.id === product.categoria_id)?.nombre || '';
                    return (
                      <tr key={product.id}>
                        <td>{product.nombre}</td>
                        <td>{product.stock}</td>
                        <td>${product.precio}</td>
                        <td>{categoria}</td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleEdit(product)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(product.id)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductList;
