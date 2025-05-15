import React from 'react';
import { useOffline } from '../context/OfflineContext';
import '../styles/notifications.css';

const ConnectionStatus = () => {
  const { isOnline } = useOffline();

  if (isOnline) return null;

  return (
    <div className="notification offline-notification">
      <p>Estás trabajando en modo offline. Los cambios se guardarán localmente.</p>
    </div>
  );
};

export default ConnectionStatus; 