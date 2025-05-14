import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    // Aquí podrías enviar el error a un servicio de monitoreo
    console.error('Error capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>¡Ups! Algo salió mal</h2>
          <p>Lo sentimos, ha ocurrido un error inesperado.</p>
          <button 
            onClick={() => window.location.reload()}
            className="error-button"
          >
            Recargar página
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="error-details">
              <summary>Detalles del error</summary>
              <pre>{this.state.error && this.state.error.toString()}</pre>
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 