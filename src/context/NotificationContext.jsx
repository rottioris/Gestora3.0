import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from '../components/Notification';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [shownProductAlerts, setShownProductAlerts] = useState(new Set());

  const addNotification = useCallback((message, type = 'info', productId = null) => {
    // Si estamos en la ruta de login o registro, no mostramos notificaciones
    if (window.location.pathname === '/login' || window.location.pathname === '/register') {
      return;
    }

    // Si es una notificación de producto
    if (productId) {
      // Si ya se mostró una alerta para este producto, no mostramos otra
      if (shownProductAlerts.has(productId)) {
        return;
      }
      // Marcamos el producto como alertado
      setShownProductAlerts(prev => new Set([...prev, productId]));
    }

    // Verificar duplicados
    const isDuplicate = notifications.some(
      n => n.message === message && n.type === type
    );
    
    if (isDuplicate) return;

    // Crear nueva notificación
    const newNotification = {
      id: Date.now(),
      message,
      type,
      productId,
      duration: 5000 // 5 segundos
    };

    // Actualizar estado manteniendo máximo 3 notificaciones
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, 3);
    });
  }, [notifications, shownProductAlerts]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            productId={notification.productId}
            onClose={() => removeNotification(notification.id)}
            duration={notification.duration}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe ser usado dentro de NotificationProvider');
  }
  return context;
}; 