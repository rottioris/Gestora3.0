import React, { useEffect, useState, useCallback } from 'react';
import { FaCheck, FaExclamationTriangle, FaInfoCircle, FaTimes, FaExclamationCircle } from 'react-icons/fa';
import './Notification.css';

const Notification = ({ message, type, onClose, duration = 5000 }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [visible, setVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, handleClose, duration]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheck className="notification-icon" />;
      case 'error':
        return <FaExclamationCircle className="notification-icon" />;
      case 'warning':
        return <FaExclamationTriangle className="notification-icon" />;
      case 'info':
        return <FaInfoCircle className="notification-icon" />;
      default:
        return <FaInfoCircle className="notification-icon" />;
    }
  };

  if (!visible) return null;

  return (
    <div className={`notification ${type} ${isExiting ? 'exiting' : ''}`} role="alert">
      {getIcon()}
      <div className="notification-content">{message}</div>
      <button 
        className="notification-close" 
        onClick={handleClose}
        aria-label="Cerrar notificación"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default Notification; 