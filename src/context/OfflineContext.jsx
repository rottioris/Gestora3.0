import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../Supabase/client';

const OfflineContext = createContext();

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline debe ser usado dentro de un OfflineProvider');
  }
  return context;
};

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userId, setUserId] = useState(() => {
    // Intentar obtener el userId del localStorage al inicio
    return localStorage.getItem('currentUserId');
  });
  const [products, setProducts] = useState(() => {
    // Cargar productos del caché al inicio
    const cachedUserId = localStorage.getItem('currentUserId');
    return cachedUserId ? JSON.parse(localStorage.getItem(`products-${cachedUserId}`) || '[]') : [];
  });
  const [categories, setCategories] = useState(() => {
    // Cargar categorías del caché al inicio
    const cachedUserId = localStorage.getItem('currentUserId');
    return cachedUserId ? JSON.parse(localStorage.getItem(`categories-${cachedUserId}`) || '[]') : [];
  });
  const [historial, setHistorial] = useState(() => {
    // Cargar historial del caché al inicio
    const cachedUserId = localStorage.getItem('currentUserId');
    return cachedUserId ? JSON.parse(localStorage.getItem(`historial-${cachedUserId}`) || '[]') : [];
  });
  const [stats, setStats] = useState(() => {
    const cachedUserId = localStorage.getItem('currentUserId');
    return cachedUserId ? JSON.parse(localStorage.getItem(`stats-${cachedUserId}`) || '{}') : {};
  });
  const [isLoading, setIsLoading] = useState(true);

  // Función para limpiar el caché al cerrar sesión
  const clearCache = useCallback(() => {
    if (userId) {
      localStorage.removeItem(`products-${userId}`);
      localStorage.removeItem(`categories-${userId}`);
      localStorage.removeItem(`historial-${userId}`);
      localStorage.removeItem(`stats-${userId}`);
      localStorage.removeItem('currentUserId');
    }
    setProducts([]);
    setCategories([]);
    setHistorial([]);
    setStats({});
    setUserId(null);
  }, [userId]);

  // Función para cargar datos desde el caché
  const loadFromCache = useCallback(() => {
    if (!userId) return;
    
    try {
      const cachedProducts = JSON.parse(localStorage.getItem(`products-${userId}`) || '[]');
      const cachedCategories = JSON.parse(localStorage.getItem(`categories-${userId}`) || '[]');
      const cachedHistorial = JSON.parse(localStorage.getItem(`historial-${userId}`) || '[]');
      const cachedStats = JSON.parse(localStorage.getItem(`stats-${userId}`) || '{}');
      
      setProducts(cachedProducts);
      setCategories(cachedCategories);
      setHistorial(cachedHistorial);
      setStats(cachedStats);
    } catch (error) {
      console.error('Error al cargar desde caché:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Función para calcular estadísticas
  const calculateStats = useCallback((products, historial) => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const totalValue = products.reduce((sum, product) => sum + (product.precio * product.stock), 0);
    
    const lowStock = products.filter(product => product.stock < 10).length;
    const outOfStock = products.filter(product => product.stock === 0).length;
    
    const recentMovements = historial.slice(0, 5);
    
    return {
      totalProducts,
      totalStock,
      totalValue,
      lowStock,
      outOfStock,
      recentMovements
    };
  }, []);

  // Función para actualizar estadísticas
  const updateStats = useCallback(() => {
    const newStats = calculateStats(products, historial);
    setStats(newStats);
    if (userId) {
      localStorage.setItem(`stats-${userId}`, JSON.stringify(newStats));
    }
  }, [products, historial, calculateStats, userId]);

  // Función para sincronizar con Supabase
  const syncWithSupabase = useCallback(async () => {
    if (!userId || !isOnline) return;

    try {
      setIsLoading(true);
      
      const [productsResponse, categoriesResponse, historialResponse] = await Promise.all([
        supabase.from('productos').select('*'),
        supabase.from('categorias').select('*'),
        supabase.from('historial').select('*').order('fecha', { ascending: false })
      ]);

      if (productsResponse.error) throw productsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;
      if (historialResponse.error) throw historialResponse.error;

      setProducts(productsResponse.data);
      setCategories(categoriesResponse.data);
      setHistorial(historialResponse.data);

      // Calcular y guardar estadísticas
      const newStats = calculateStats(productsResponse.data, historialResponse.data);
      setStats(newStats);

      // Guardar en caché
      localStorage.setItem(`products-${userId}`, JSON.stringify(productsResponse.data));
      localStorage.setItem(`categories-${userId}`, JSON.stringify(categoriesResponse.data));
      localStorage.setItem(`historial-${userId}`, JSON.stringify(historialResponse.data));
      localStorage.setItem(`stats-${userId}`, JSON.stringify(newStats));

    } catch (error) {
      console.error('Error al sincronizar con Supabase:', error);
      loadFromCache();
    } finally {
      setIsLoading(false);
    }
  }, [userId, isOnline, loadFromCache, calculateStats]);

  // Función para actualizar productos
  const updateProducts = async (newProducts) => {
    try {
      if (isOnline) {
        const { error } = await supabase.from('productos').upsert(newProducts);
        if (error) throw error;
      }
      setProducts(newProducts);
      localStorage.setItem(`products-${userId}`, JSON.stringify(newProducts));
      updateStats();
    } catch (error) {
      console.error('Error al actualizar productos:', error);
      throw error;
    }
  };

  // Función para actualizar categorías
  const updateCategories = async (newCategories) => {
    try {
      if (isOnline) {
        const { error } = await supabase.from('categorias').upsert(newCategories);
        if (error) throw error;
      }
      setCategories(newCategories);
      localStorage.setItem(`categories-${userId}`, JSON.stringify(newCategories));
    } catch (error) {
      console.error('Error al actualizar categorías:', error);
      throw error;
    }
  };

  // Función para actualizar historial
  const updateHistorial = async (newHistorial) => {
    try {
      if (isOnline) {
        const { error } = await supabase.from('historial').upsert(newHistorial);
        if (error) throw error;
      }
      setHistorial(newHistorial);
      localStorage.setItem(`historial-${userId}`, JSON.stringify(newHistorial));
      updateStats();
    } catch (error) {
      console.error('Error al actualizar historial:', error);
      throw error;
    }
  };

  // Función para añadir una entrada al historial
  const addHistorialEntry = async (entry) => {
    try {
      const newEntry = {
        ...entry,
        id: Math.floor(Math.random() * 1000),
        fecha: new Date().toISOString()
      };

      if (isOnline) {
        const { error } = await supabase.from('historial').insert(newEntry);
        if (error) throw error;
      }

      const updatedHistorial = [newEntry, ...historial];
      setHistorial(updatedHistorial);
      localStorage.setItem(`historial-${userId}`, JSON.stringify(updatedHistorial));
      updateStats();
    } catch (error) {
      console.error('Error al añadir entrada al historial:', error);
      throw error;
    }
  };

  // Obtener el usuario actual
  const getCurrentUser = useCallback(async () => {
    try {
      if (isOnline) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          localStorage.setItem('currentUserId', user.id);
          await syncWithSupabase();
        }
      } else {
        // Si estamos offline, cargar desde caché
        loadFromCache();
      }
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      // Si hay error y estamos offline, intentar cargar desde caché
      if (!isOnline) {
        loadFromCache();
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, loadFromCache, syncWithSupabase]);

  // Efecto para manejar cambios en el estado de la conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncWithSupabase();
    };

    const handleOffline = () => {
      setIsOnline(false);
      loadFromCache();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncWithSupabase, loadFromCache]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  // Efecto para actualizar estadísticas cuando cambian los datos
  useEffect(() => {
    updateStats();
  }, [products, historial, updateStats]);

  const value = {
    isOnline,
    userId,
    products,
    categories,
    historial,
    stats,
    isLoading,
    updateProducts,
    updateCategories,
    updateHistorial,
    addHistorialEntry,
    clearCache
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}; 