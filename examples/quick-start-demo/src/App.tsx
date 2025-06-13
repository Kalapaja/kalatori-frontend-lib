import React, { useState } from 'react';
import './App.css';
import PaymentDemo from './PaymentDemo';
import OpenCartStylePayment from './OpenCartStylePayment';

type DemoType = 'api' | 'ui';

function App() {
  const [activeDemo, setActiveDemo] = useState<DemoType>('ui');

  return (
    <div className="App">
      <div style={{ 
        padding: '20px', 
        borderBottom: '1px solid #ddd',
        backgroundColor: '#f8f9fa',
        textAlign: 'center'
      }}>
        <h1>🚀 Kalatori Payment Integration</h1>
        <div style={{ marginTop: '15px' }}>
          <button
            onClick={() => setActiveDemo('ui')}
            style={{
              ...buttonStyle,
              backgroundColor: activeDemo === 'ui' ? '#007bff' : '#6c757d'
            }}
          >
            🎨 OpenCart-Style UI
          </button>
          <button
            onClick={() => setActiveDemo('api')}
            style={{
              ...buttonStyle,
              backgroundColor: activeDemo === 'api' ? '#007bff' : '#6c757d'
            }}
          >
            🔧 API Integration Demo
          </button>
        </div>
      </div>

      {activeDemo === 'ui' && <OpenCartStylePayment />}
      {activeDemo === 'api' && <PaymentDemo />}
    </div>
  );
}

const buttonStyle = {
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600' as const,
  margin: '0 5px'
};

export default App;