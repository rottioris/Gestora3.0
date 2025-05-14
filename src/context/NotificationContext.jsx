import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Notification from '../components/Notification';
import '../styles/notifications.css';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe ser usado dentro de un NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const timeoutsRef = useRef({});
  const notificationIdsRef = useRef(new Set());
  const dismissedNotificationsRef = useRef(new Set());

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    // Verificar si la notificación fue cerrada manualmente
    const notificationKey = `${message}-${type}`;
    if (dismissedNotificationsRef.current.has(notificationKey)) {
      return;
    }

    // Verificar si ya existe una notificación similar
    const isDuplicate = notifications.some(
      notification => notification.message === message && notification.type === type
    );

    if (isDuplicate) {
      return;
    }

    // Generar un ID único
    const id = Date.now() + Math.random();
    notificationIdsRef.current.add(id);

    setNotifications(prev => {
      // Filtrar notificaciones antiguas del mismo tipo
      const filteredNotifications = prev.filter(
        notification => notification.type !== type || 
        (notification.type === type && notification.message !== message)
      );
      
      // Agregar la nueva notificación
      const newNotifications = [...filteredNotifications, { id, message, type, key: notificationKey }];
      
      // Mantener solo las 3 notificaciones más recientes
      return newNotifications.slice(-3);
    });

    // Limpiar el timeout anterior si existe
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
    }

    // Establecer nuevo timeout
    timeoutsRef.current[id] = setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      delete timeoutsRef.current[id];
      notificationIdsRef.current.delete(id);
    }, duration);
  }, [notifications]);

  const removeNotification = useCallback((id) => {
    // Limpiar el timeout si existe
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
    
    // Encontrar la notificación que se está cerrando
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      // Agregar la notificación al conjunto de notificaciones cerradas
      dismissedNotificationsRef.current.add(notification.key);
    }
    
    notificationIdsRef.current.delete(id);
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            id={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}; 