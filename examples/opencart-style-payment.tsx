import React, { useState, useEffect } from 'react';
import { 
  useKalatoriPayment, 
  useDaemonStatus,
  useKalatoriClient,
  KalatoriClientConfig,
  OrderStatus,
  ServerStatus 
} from '@kalatori/frontend-lib';

// Style configuration matching OpenCart implementation
const styles = {
  container: {
    fontFamily: 'Inter, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px'
  },
  alertSuccess: {
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    color: '#155724',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px'
  },
  alertWarning: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    color: '#856404',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px'
  },
  alertDanger: {
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    color: '#721c24',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px'
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginRight: '10px'
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginRight: '10px'
  },
  buttonSuccess: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginRight: '10px'
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginLeft: '10px',
    fontSize: '14px'
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginLeft: '10px',
    fontSize: '14px'
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    backgroundColor: '#f8f9fa'
  },
  progressBar: {
    width: '100%',
    height: '20px',
    backgroundColor: '#e9ecef',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
    transition: 'width 0.3s ease'
  }
};

interface OpenCartStylePaymentProps {
  // Configuration matching OpenCart setup
  shopName?: string;
  daemonUrl: string;
  allowedCurrencies: string[];
  orderId: string;
  orderTotal: number;
  orderCurrency: string;
  onSuccess?: (orderStatus: OrderStatus) => void;
  onCancel?: () => void;
}

const OpenCartStylePayment: React.FC<OpenCartStylePaymentProps> = ({
  shopName = '',
  daemonUrl,
  allowedCurrencies,
  orderId,
  orderTotal,
  orderCurrency,
  onSuccess,
  onCancel
}) => {
  // Payment flow states matching OpenCart implementation
  const [step, setStep] = useState<'loading' | 'select_currency' | 'processing' | 'completed' | 'error'>('loading');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Loading engine...');
  const [redirectCountdown, setRedirectCountdown] = useState<number>(7);

  const clientConfig: KalatoriClientConfig = {
    baseUrl: daemonUrl,
    mode: 'embedded', // Following OpenCart pattern of going through backend
    timeout: 30000
  };

  // Check daemon status first (like kalatori_test() in admin)
  const {
    status: daemonStatus,
    loading: daemonLoading,
    error: daemonError,
    isHealthy
  } = useDaemonStatus(useKalatoriClient(clientConfig), {
    refreshInterval: 0, // One-time check
    enabled: true
  });

  // Main payment hook
  const {
    order,
    paymentStatus,
    creatingOrder,
    isMonitoring,
    isCompleted,
    isTimedOut,
    error: paymentError,
    attempts,
    createOrder,
    reset,
    clearError
  } = useKalatoriPayment({
    clientConfig,
    autoStartMonitoring: true,
    monitoringInterval: 5000, // Match DOT.js polling
    maxAttempts: 120, // 10 minutes like OpenCart
    onPaymentUpdate: (update) => {
      console.log('Payment update:', update);
      setStatusMessage(`Monitoring payment... (attempt ${attempts})`);
    },
    onPaymentComplete: (update) => {
      console.log('Payment completed:', update);
      setStep('completed');
      setStatusMessage('Payment confirmed! Redirecting...');
      onSuccess?.(update.status);
    },
    onPaymentTimeout: () => {
      setStep('error');
      setStatusMessage('Payment timeout. Please try again.');
    }
  });

  // Initialize - check daemon status
  useEffect(() => {
    if (daemonLoading) {
      setStatusMessage('Checking payment gateway status...');
      return;
    }

    if (daemonError || !isHealthy) {
      setStep('error');
      setStatusMessage('Payment gateway is not available. Please try again later.');
      return;
    }

    if (daemonStatus) {
      // Validate currencies like OpenCart does
      const supportedCurrencies = Object.keys(daemonStatus.supported_currencies);
      const validCurrencies = allowedCurrencies.filter(cur => 
        supportedCurrencies.includes(cur)
      );

      if (validCurrencies.length === 0) {
        setStep('error');
        setStatusMessage('No supported currencies available.');
        return;
      }

      // Auto-select currency if only one option or exact match
      if (validCurrencies.length === 1) {
        setSelectedCurrency(validCurrencies[0]);
      } else if (validCurrencies.includes(orderCurrency)) {
        setSelectedCurrency(orderCurrency);
      } else {
        // Show currency selection
        setStep('select_currency');
        setStatusMessage('Select payment currency:');
        return;
      }

      setStep('select_currency');
      setStatusMessage('Payment gateway ready.');
    }
  }, [daemonStatus, daemonLoading, daemonError, isHealthy, allowedCurrencies, orderCurrency]);

  // Handle payment submission (like opencart3_submit)
  const handleSubmit = async () => {
    if (!selectedCurrency) {
      setStatusMessage('Please select a currency.');
      return;
    }

    setStep('processing');
    setStatusMessage('Creating payment order...');

    // Create order with OpenCart-style ID format
    const orderApiId = `oc3_${shopName ? shopName + '_' : ''}${orderId}`;
    
    const result = await createOrder(orderApiId, {
      amount: orderTotal,
      currency: selectedCurrency
    });

    if (result) {
      setStatusMessage('Order created. Monitoring for payment...');
    }
  };

  // Redirect countdown for completed payments
  useEffect(() => {
    if (step === 'completed' && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (step === 'completed' && redirectCountdown === 0) {
      // Trigger redirect
      window.location.href = '/checkout/success';
    }
  }, [step, redirectCountdown]);

  // Error display helper
  const ErrorAlert = ({ message }: { message: string }) => (
    <div style={styles.alertDanger}>
      <strong>Error:</strong> {message}
      <button 
        onClick={() => { clearError(); reset(); setStep('loading'); }}
        style={{ ...styles.buttonSecondary, marginLeft: '10px', padding: '5px 10px' }}
      >
        Retry
      </button>
    </div>
  );

  // Currency selection matching OpenCart design
  const CurrencySelector = () => (
    <div style={styles.card}>
      <h3>Select Payment Currency</h3>
      <div style={{ marginBottom: '15px' }}>
        <label>
          Currency:
          <select 
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            style={styles.select}
          >
            <option value="">-- Select Currency --</option>
            {allowedCurrencies.map(currency => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>
      </div>
      
      {daemonStatus && (
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          <strong>Gateway Info:</strong><br/>
          Version: {daemonStatus.server_info.version}<br/>
          Instance: {daemonStatus.server_info.instance_id}<br/>
          {daemonStatus.server_info.debug && <span style={{ color: 'orange' }}>Debug Mode</span>}
        </div>
      )}

      <button 
        onClick={handleSubmit}
        disabled={!selectedCurrency || creatingOrder}
        style={{
          ...styles.button,
          opacity: (!selectedCurrency || creatingOrder) ? 0.6 : 1,
          cursor: (!selectedCurrency || creatingOrder) ? 'not-allowed' : 'pointer'
        }}
      >
        {creatingOrder ? 'Creating Order...' : 'Confirm Payment'}
      </button>
      
      {onCancel && (
        <button onClick={onCancel} style={styles.buttonSecondary}>
          Cancel
        </button>
      )}
    </div>
  );

  // Payment processing display
  const ProcessingDisplay = () => (
    <div style={styles.card}>
      <h3>Processing Payment</h3>
      
      {order && (
        <div style={styles.alertSuccess}>
          <strong>Order Created Successfully!</strong><br/>
          Order ID: {order.order}<br/>
          Amount: {order.amount} {order.currency.currency}<br/>
          Payment Account: <code>{order.payment_account}</code>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <strong>Status:</strong> {statusMessage}
      </div>

      {isMonitoring && (
        <div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${Math.min((attempts / 120) * 100, 100)}%`
              }}
            />
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Monitoring attempt {attempts} of 120 (timeout in {Math.max(0, 10 - Math.floor(attempts * 5 / 60))} minutes)
          </div>
        </div>
      )}

      {paymentStatus?.transactions && paymentStatus.transactions.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h4>Transaction History</h4>
          {paymentStatus.transactions.map((tx, index) => (
            <div key={index} style={{ 
              border: '1px solid #ddd', 
              padding: '10px', 
              marginBottom: '10px',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <strong>Amount:</strong> {tx.amount} {tx.currency.currency}<br/>
              <strong>Status:</strong> {tx.status}<br/>
              <strong>From:</strong> <code>{tx.sender}</code><br/>
              <strong>To:</strong> <code>{tx.recipient}</code><br/>
              {tx.block_number && <><strong>Block:</strong> {tx.block_number}</>}
            </div>
          ))}
        </div>
      )}

      <button 
        onClick={() => { reset(); setStep('select_currency'); }}
        style={styles.buttonSecondary}
      >
        Cancel & Start Over
      </button>
    </div>
  );

  // Completion display with auto-redirect
  const CompletionDisplay = () => (
    <div style={styles.card}>
      <div style={styles.alertSuccess}>
        <h3>✅ Payment Completed Successfully!</h3>
        <p>Your payment has been confirmed and processed.</p>
        <p>You will be redirected to your order in <strong>{redirectCountdown}</strong> seconds.</p>
      </div>

      {order && (
        <div style={{ fontSize: '14px', color: '#666' }}>
          <strong>Order Details:</strong><br/>
          Order ID: {order.order}<br/>
          Amount: {order.amount} {order.currency.currency}<br/>
          Status: {order.payment_status}
        </div>
      )}

      <button 
        onClick={() => window.location.href = '/checkout/success'}
        style={styles.buttonSuccess}
      >
        Continue to Order Confirmation
      </button>
    </div>
  );

  return (
    <div style={styles.container}>
      <div id="polkadot_work">
        <h2>
          <img 
            src="/catalog/view/theme/default/image/polkadot/polkadot.webp" 
            alt="Polkadot" 
            style={{ height: '40px', marginRight: '10px' }}
          />
          Kalatori Payment Gateway
        </h2>

        {/* Error states */}
        {(paymentError || daemonError) && (
          <ErrorAlert message={paymentError?.message || daemonError?.message || 'Unknown error'} />
        )}

        {isTimedOut && (
          <div style={styles.alertWarning}>
            <strong>Payment Timeout:</strong> The payment was not received within the expected time frame.
            Please try again or contact support if you have already sent the payment.
          </div>
        )}

        {/* Main content based on step */}
        {step === 'loading' && (
          <div style={styles.card}>
            <div>Loading payment engine...</div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {statusMessage}
            </div>
          </div>
        )}

        {step === 'select_currency' && <CurrencySelector />}
        {step === 'processing' && <ProcessingDisplay />}
        {step === 'completed' && <CompletionDisplay />}

        {step === 'error' && (
          <div style={styles.card}>
            <div style={styles.alertDanger}>
              <strong>Payment System Error</strong><br/>
              {statusMessage}
            </div>
            <button 
              onClick={() => { setStep('loading'); window.location.reload(); }}
              style={styles.button}
            >
              Reload Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenCartStylePayment;