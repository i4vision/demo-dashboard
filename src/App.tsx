import { useState } from 'react';
import './App.css';
import { supabase, hasSupabaseConfig } from './supabaseClient';

// Type definitions for dynamic data from DB
interface ClientData {
  id: number;
  nombre: string;
  apellido: string;
  cedula: number;
  contactable: boolean;
  voluntad: boolean;
  fecha: string; // ISO 8601
  monto: number;
}

// Hardcoded static values
const HARD_VALUES = {
  entidadBancaria: 'Banco Credi XXI',
  estado: 'En mora',
  tipoDeuda: 'Crédito Hipotecario',
  montoDeuda: '576.20',
  fechaMora: '15 de abril de 2026',
};

function App() {
  const [data, setData] = useState<ClientData | null>(null);
  const [clientRequested, setClientRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGetClient = async () => {
    if (!hasSupabaseConfig) {
      alert('Missing Supabase variables! Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as build arguments in your Portainer stack.');
      return;
    }
    setLoading(true);
    setClientRequested(true);
    
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .limit(1)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching client:', error);
        alert('Error loading client data. Did you run the SQL command to create the table?');
      } else if (!clients) {
        // No rows returned
        setData(null);
      } else {
        setData(clients as ClientData);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!hasSupabaseConfig) {
      setData(null);
      setClientRequested(false);
      return;
    }
    setLoading(true);
    try {
      // Delete all records from the database
      const { error } = await supabase
        .from('clients')
        .delete()
        .neq('id', 0); // Deletes all rows where id != 0 (which is all rows)
        
      if (error) {
        console.error('Error clearing client:', error);
      }
      
      // Clear GUI state
      setData(null);
      setClientRequested(false);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">American Call Center Dashboard</h1>
        <div className="action-buttons">
          <button 
            className="btn btn-primary" 
            onClick={handleGetClient}
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeLinecap="round" opacity="0.2"/>
                <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="32" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
            )}
            Obtener Cliente
          </button>
          <button className="btn btn-danger" onClick={handleClear} disabled={loading} style={{ clipPath: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)', padding: '0.75rem 2rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Limpiar
          </button>
        </div>
      </header>

      <>
        <div className="dashboard-grid">
          <div className="card glass-panel client-card">
            <h2 className="card-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Datos del Cliente
            </h2>
            
            <div className="data-row">
              <span className="data-label">Nombre y Apellido</span>
              <span className="data-value highlight">
                {data ? `${data.nombre} ${data.apellido}` : '-'}
              </span>
            </div>
            
            <div className="data-row">
              <span className="data-label">Número de Cédula</span>
              <span className="data-value">
                {data ? data.cedula : '-'}
              </span>
            </div>
            
            <div className="data-row">
              <span className="data-label">Entidad Bancaria</span>
              <span className="data-value">{clientRequested ? HARD_VALUES.entidadBancaria : '-'}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid bottom-row">
          <div className="card glass-panel">
            <h2 className="card-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Datos de la Deuda
            </h2>
            
            <div className="data-row">
              <span className="data-label">Estado</span>
              <span className={`data-value ${clientRequested ? 'danger' : ''}`}>{clientRequested ? HARD_VALUES.estado : '-'}</span>
            </div>
            
            <div className="data-row">
              <span className="data-label">Tipo de Deuda</span>
              <span className="data-value">{clientRequested ? HARD_VALUES.tipoDeuda : '-'}</span>
            </div>
            
            <div className="data-row">
              <span className="data-label">Monto de la Deuda</span>
              <span className={`data-value ${clientRequested ? 'danger' : ''}`}>{clientRequested ? `U$ ${HARD_VALUES.montoDeuda}` : '-'}</span>
            </div>
            
            <div className="data-row">
              <span className="data-label">Fecha de Mora</span>
              <span className={`data-value ${clientRequested ? 'warning' : ''}`}>{clientRequested ? HARD_VALUES.fechaMora : '-'}</span>
            </div>
          </div>

          <div className="card glass-panel">
            <h2 className="card-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Estado del Cliente
            </h2>
            
            <div className="data-row">
              <span className="data-label">Contactable</span>
              <span className={`data-value ${data ? (data.contactable ? 'success' : 'danger') : ''}`}>
                {data ? (data.contactable ? 'Si' : 'No') : '-'}
              </span>
            </div>
            
            <div className="data-row">
              <span className="data-label">Voluntad de Pago</span>
              <span className={`data-value ${data ? (data.voluntad ? 'success' : 'danger') : ''}`}>
                {data ? (data.voluntad ? 'Si' : 'No') : '-'}
              </span>
            </div>
            
            <div className="data-row">
              <span className="data-label">Fecha Compromiso</span>
              <span className="data-value highlight">
                {data ? formatDate(data.fecha) : '-'}
              </span>
            </div>
            
            <div className="data-row">
              <span className="data-label">Monto Compromiso</span>
              <span className="data-value success">
                {data ? `U$ ${data.monto}` : '-'}
              </span>
            </div>
          </div>
        </div>
      </>
    </div>
  );
}

export default App;
