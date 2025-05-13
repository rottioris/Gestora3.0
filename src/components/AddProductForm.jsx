import React, { useState, useEffect } from 'react';
import './AddProductForm.css';
import { supabase } from '../Supabase/client';

const AddProductForm = ({ onClose, productoEditar }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria_id: '',
    cantidad: '',
    precio: '',
    descripcion: ''
  });

  const [categorias, setCategorias] = useState([]);

  // Cargar categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      const { data, error } = await supabase.from('categorias').select();
      if (error) {
        console.error('Error al cargar categorías:', error.message);
      } else {
        setCategorias(data);
      }
    };
    fetchCategorias();
  }, []);

  // Si estamos editando, llenar el formulario
  useEffect(() => {
    if (productoEditar) {
      setFormData({
        nombre: productoEditar.nombre || '',
        categoria_id: productoEditar.categoria_id || '',
        cantidad: productoEditar.stock || '',
        precio: productoEditar.precio || '',
        descripcion: productoEditar.descripcion || ''
      });
    }
  }, [productoEditar]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.cantidad || !formData.categoria_id) {
      alert('Por favor, completa los campos obligatorios.');
      return;
    }

    const producto = {
      nombre: formData.nombre,
      categoria_id: parseInt(formData.categoria_id),
      stock: parseInt(formData.cantidad),
      precio: parseFloat(formData.precio || 0),
      descripcion: formData.descripcion
    };

    let error;
    if (productoEditar) {
      // Si existe productoEditar, entonces ACTUALIZAR
      ({ error } = await supabase
        .from('productos')
        .update(producto)
        .eq('id', productoEditar.id)
      );
    } else {
      // Si NO existe productoEditar, entonces INSERTAR
      ({ error } = await supabase
        .from('productos')
        .insert([producto])
      );
    }

    if (error) {
      console.error('Error al guardar producto:', error.message);
      alert('Hubo un error al guardar el producto.');
    } else {
      alert(productoEditar ? 'Producto actualizado.' : 'Producto agregado.');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>{productoEditar ? 'Editar Producto' : 'Agregar Producto'}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nombre: *
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Categoría: *
            <select
              name="categoria_id"
              value={formData.categoria_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            Stock: *
            <input
              type="number"
              name="cantidad"
              value={formData.cantidad}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Precio:
            <input
              type="number"
              name="precio"
              step="0.01"
              value={formData.precio}
              onChange={handleChange}
            />
          </label>
          <label>
            Descripción:
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
            ></textarea>
          </label>
          <div className="modal-actions">
            <button type="submit" className="action-button">{productoEditar ? 'Actualizar' : 'Agregar'}</button>
            <button type="button" onClick={onClose} className="action-button cancel">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;
