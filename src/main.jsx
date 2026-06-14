import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nProvider } from './hooks/useI18n';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#f87171', background: '#020617', height: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚠️ Fallo de Inicialización</h1>
          <p style={{ marginBottom: '1rem', color: '#94a3b8' }}>La aplicación no pudo arrancar. Es muy probable que falte configurar el archivo <b>.env</b> con tus credenciales reales de Firebase.</p>
          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #1e293b', overflowX: 'auto' }}>
            <p><strong>Error:</strong> {this.state.error?.message}</p>
          </div>
          <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Por favor, sigue las instrucciones en el chat para configurar Firebase, guarda el archivo .env y recarga esta página.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
