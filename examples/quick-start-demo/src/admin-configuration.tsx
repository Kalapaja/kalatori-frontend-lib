import React, { useState } from 'react';
import { 
  useKalatoriClient, 
  useDaemonStatus,
  KalatoriClientConfig 
} from '@kalatori/frontend-lib';

// Admin configuration component matching OpenCart admin panel
const AdminConfiguration: React.FC = () => {
  const [config, setConfig] = useState({
    shopName: '',
    daemonUrl: 'https://api.staging.reloket.com',
    selectedCurrencies: ['DOT', 'USDC', 'USDt'],
    enabled: true,
    orderStatusId: '2'
  });

  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
    currencies?: string[];
    version?: string;
    remark?: string;
  }>({ status: 'idle', message: '' });

  const clientConfig: KalatoriClientConfig = {
    baseUrl: config.daemonUrl,
    mode: 'embedded',
    timeout: 10000
  };

  const client = useKalatoriClient(clientConfig);

  // Test daemon connection (like kalatori_test() function)
  const testConnection = async () => {
    setTestResult({ status: 'testing', message: 'Testing connection...' });

    try {
      const response = await client.getStatus();
      const supportedCurrencies = Object.keys(response.data.supported_currencies);
      
      setTestResult({
        status: 'success',
        message: 'Daemon is available',
        currencies: supportedCurrencies,
        version: response.data.server_info.version,
        remark: response.data.server_info.kalatori_remark
      });

      // Auto-populate currencies if empty
      if (config.selectedCurrencies.length === 0) {
        setConfig(prev => ({
          ...prev,
          selectedCurrencies: supportedCurrencies
        }));
      }

    } catch (error: any) {
      setTestResult({
        status: 'error',
        message: `Daemon is not responding: ${error.message || 'Unknown error'}`
      });
    }
  };

  // Toggle currency selection (like kalatori_pin function)
  const toggleCurrency = (currency: string) => {
    setConfig(prev => ({
      ...prev,
      selectedCurrencies: prev.selectedCurrencies.includes(currency)
        ? prev.selectedCurrencies.filter(c => c !== currency)
        : [...prev.selectedCurrencies, currency]
    }));
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '30px',
      paddingBottom: '20px',
      borderBottom: '1px solid #ddd'
    },
    logo: {
      height: '50px',
      marginRight: '15px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold',
      color: '#333'
    },
    input: {
      width: '100%',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box' as const
    },
    select: {
      width: '100%',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box' as const
    },
    button: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      marginTop: '10px'
    },
    testButton: {
      backgroundColor: '#8B4513',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      marginTop: '10px'
    },
    currencyButton: {
      margin: '5px',
      padding: '8px 12px',
      border: '1px solid #007bff',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      backgroundColor: 'white',
      color: '#007bff'
    },
    currencyButtonSelected: {
      margin: '5px',
      padding: '8px 12px',
      border: '1px solid #007bff',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      backgroundColor: '#007bff',
      color: 'white'
    },
    alert: {
      padding: '15px',
      marginTop: '15px',
      borderRadius: '4px'
    },
    alertSuccess: {
      backgroundColor: '#d4edda',
      border: '1px solid #c3e6cb',
      color: '#155724'
    },
    alertError: {
      backgroundColor: '#f8d7da',
      border: '1px solid #f5c6cb',
      color: '#721c24'
    },
    alertInfo: {
      backgroundColor: '#d1ecf1',
      border: '1px solid #bee5eb',
      color: '#0c5460'
    },
    helpText: {
      fontSize: '12px',
      color: '#666',
      marginTop: '5px'
    },
    saveButton: {
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      padding: '15px 30px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      marginTop: '30px',
      marginRight: '15px'
    },
    cancelButton: {
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      padding: '15px 30px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      marginTop: '30px'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header matching OpenCart admin */}
      <div style={styles.header}>
        <img 
          src="/catalog/view/theme/default/image/polkadot/polkadot.webp" 
          alt="Polkadot"
          style={styles.logo}
        />
        <h1 style={{ margin: 0, color: '#333' }}>
          Kalatori Payment Gateway Configuration
        </h1>
      </div>

      <form>
        {/* Shop Name Configuration */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Shop Name
          </label>
          <input
            type="text"
            value={config.shopName}
            onChange={(e) => setConfig(prev => ({ ...prev, shopName: e.target.value }))}
            placeholder="e.g., MyStore"
            style={styles.input}
          />
          <div style={styles.helpText}>
            Optional shop identifier that will be included in order IDs sent to the daemon
          </div>
        </div>

        {/* Daemon URL Configuration */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Kalatori Daemon URL
          </label>
          <input
            type="url"
            value={config.daemonUrl}
            onChange={(e) => setConfig(prev => ({ ...prev, daemonUrl: e.target.value }))}
            placeholder="https://api.your-daemon.com"
            style={styles.input}
          />
          <div style={styles.helpText}>
            The base URL of your Kalatori daemon API
          </div>
          
          <button
            type="button"
            onClick={testConnection}
            disabled={testResult.status === 'testing'}
            style={styles.testButton}
          >
            {testResult.status === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>

          {/* Test Results */}
          {testResult.status !== 'idle' && (
            <div style={{
              ...styles.alert,
              ...(testResult.status === 'success' ? styles.alertSuccess : 
                  testResult.status === 'error' ? styles.alertError : styles.alertInfo)
            }}>
              <strong>
                {testResult.status === 'success' ? 'Success:' : 
                 testResult.status === 'error' ? 'Error:' : 'Info:'}
              </strong> {testResult.message}
              
              {testResult.status === 'success' && (
                <div style={{ marginTop: '10px' }}>
                  <div><strong>Version:</strong> {testResult.version}</div>
                  {testResult.remark && <div><strong>Remark:</strong> {testResult.remark}</div>}
                  
                  {testResult.currencies && (
                    <div style={{ marginTop: '10px' }}>
                      <strong>Available Currencies:</strong><br/>
                      {testResult.currencies.map(currency => (
                        <button
                          key={currency}
                          type="button"
                          onClick={() => toggleCurrency(currency)}
                          style={config.selectedCurrencies.includes(currency) 
                            ? styles.currencyButtonSelected 
                            : styles.currencyButton
                          }
                        >
                          {currency}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Currency Configuration */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Allowed Currencies
          </label>
          <input
            type="text"
            value={config.selectedCurrencies.join(' ')}
            onChange={(e) => setConfig(prev => ({ 
              ...prev, 
              selectedCurrencies: e.target.value.trim() ? e.target.value.trim().split(/\s+/) : []
            }))}
            placeholder="DOT USDC USDt"
            style={styles.input}
          />
          <div style={styles.helpText}>
            Space-separated list of currencies to accept. Use the test button above to see available currencies.
          </div>
        </div>

        {/* Order Status Configuration */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Order Status for Completed Payments
          </label>
          <select
            value={config.orderStatusId}
            onChange={(e) => setConfig(prev => ({ ...prev, orderStatusId: e.target.value }))}
            style={styles.select}
          >
            <option value="1">Pending</option>
            <option value="2">Processing</option>
            <option value="3">Shipped</option>
            <option value="5">Complete</option>
            <option value="7">Canceled</option>
            <option value="8">Denied</option>
            <option value="9">Canceled Reversal</option>
            <option value="10">Failed</option>
            <option value="11">Refunded</option>
            <option value="12">Reversed</option>
            <option value="13">Chargeback</option>
            <option value="14">Expired</option>
            <option value="15">Processed</option>
            <option value="16">Voided</option>
          </select>
          <div style={styles.helpText}>
            Status to set when payments are confirmed via Kalatori
          </div>
        </div>

        {/* Enable/Disable */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Payment Method Status
          </label>
          <select
            value={config.enabled ? '1' : '0'}
            onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.value === '1' }))}
            style={styles.select}
          >
            <option value="1">Enabled</option>
            <option value="0">Disabled</option>
          </select>
          <div style={styles.helpText}>
            Enable or disable the Kalatori payment method
          </div>
        </div>

        {/* Configuration Summary */}
        <div style={{ ...styles.alert, ...styles.alertInfo }}>
          <h4>Configuration Summary</h4>
          <pre style={{ fontSize: '12px', margin: '10px 0' }}>
{JSON.stringify({
  shopName: config.shopName || 'Not set',
  daemonUrl: config.daemonUrl,
  allowedCurrencies: config.selectedCurrencies,
  orderStatusId: config.orderStatusId,
  enabled: config.enabled
}, null, 2)}
          </pre>
        </div>

        {/* Action Buttons */}
        <div>
          <button type="submit" style={styles.saveButton}>
            💾 Save Configuration
          </button>
          <button type="button" style={styles.cancelButton}>
            ↩️ Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminConfiguration;