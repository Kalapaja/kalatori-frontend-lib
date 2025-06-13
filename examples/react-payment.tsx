import React, { useState } from 'react';
import { useKalatoriPayment, KalatoriClientConfig } from '@kalatori/frontend-lib';

// Example React component showing complete payment flow
const PaymentComponent: React.FC = () => {
  const [orderId, setOrderId] = useState<string>('');
  const [amount, setAmount] = useState<number>(10);
  const [currency, setCurrency] = useState<string>('DOT');

  const clientConfig: KalatoriClientConfig = {
    baseUrl: 'https://api.staging.reloket.com',
    mode: 'embedded', // or 'offsite'
    timeout: 30000
  };

  const {
    order,
    paymentStatus,
    creatingOrder,
    isMonitoring,
    isCompleted,
    isTimedOut,
    error,
    attempts,
    createOrder,
    startMonitoring,
    stopMonitoring,
    reset,
    clearError
  } = useKalatoriPayment({
    clientConfig,
    autoStartMonitoring: true,
    onPaymentUpdate: (update) => {
      console.log('Payment update:', update);
    },
    onPaymentComplete: (update) => {
      console.log('Payment completed:', update);
      alert('Payment successful!');
    },
    onPaymentTimeout: () => {
      console.log('Payment timed out');
      alert('Payment timed out. Please try again.');
    }
  });

  const handleCreateOrder = async () => {
    if (!orderId.trim()) {
      alert('Please enter an order ID');
      return;
    }

    await createOrder(orderId, {
      amount,
      currency
    });
  };

  const handleReset = () => {
    setOrderId('');
    setAmount(10);
    setCurrency('DOT');
    reset();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Kalatori Payment Demo</h2>

      {error && (
        <div style={{ 
          background: '#ffe6e6', 
          border: '1px solid #ff0000', 
          padding: '10px', 
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {error.message}
          <button 
            onClick={clearError}
            style={{ marginLeft: '10px', padding: '5px 10px' }}
          >
            Clear Error
          </button>
        </div>
      )}

      {!order ? (
        <div>
          <h3>Create Order</h3>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Order ID:
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter unique order ID"
                style={{ marginLeft: '10px', padding: '5px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Amount:
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="0.01"
                step="0.01"
                style={{ marginLeft: '10px', padding: '5px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label>
              Currency:
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{ marginLeft: '10px', padding: '5px' }}
              >
                <option value="DOT">DOT</option>
                <option value="USDC">USDC</option>
                <option value="USDt">USDt</option>
              </select>
            </label>
          </div>
          <button
            onClick={handleCreateOrder}
            disabled={creatingOrder}
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: creatingOrder ? 'not-allowed' : 'pointer'
            }}
          >
            {creatingOrder ? 'Creating Order...' : 'Create Order'}
          </button>
        </div>
      ) : (
        <div>
          <h3>Order Created Successfully!</h3>
          <div style={{ 
            background: '#e6f3ff', 
            border: '1px solid #007bff', 
            padding: '15px', 
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <p><strong>Order ID:</strong> {order.order}</p>
            <p><strong>Amount:</strong> {order.amount} {order.currency.currency}</p>
            <p><strong>Payment Account:</strong> {order.payment_account}</p>
            <p><strong>Payment Status:</strong> {order.payment_status}</p>
            <p><strong>Withdrawal Status:</strong> {order.withdrawal_status}</p>
          </div>

          <h4>Payment Monitoring</h4>
          <div style={{ marginBottom: '20px' }}>
            <p><strong>Status:</strong> {isMonitoring ? 'Monitoring...' : 'Stopped'}</p>
            <p><strong>Attempts:</strong> {attempts}</p>
            {paymentStatus && (
              <p><strong>Current Status:</strong> {paymentStatus.payment_status}</p>
            )}
            {isCompleted && <p style={{ color: 'green' }}>✅ Payment Completed!</p>}
            {isTimedOut && <p style={{ color: 'red' }}>⏰ Payment Timed Out</p>}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={startMonitoring}
              disabled={isMonitoring}
              style={{ 
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isMonitoring ? 'not-allowed' : 'pointer'
              }}
            >
              Start Monitoring
            </button>
            <button
              onClick={stopMonitoring}
              disabled={!isMonitoring}
              style={{ 
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isMonitoring ? 'not-allowed' : 'pointer'
              }}
            >
              Stop Monitoring
            </button>
            <button
              onClick={handleReset}
              style={{ 
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>

          {paymentStatus?.transactions && paymentStatus.transactions.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>Transactions</h4>
              {paymentStatus.transactions.map((tx, index) => (
                <div key={index} style={{ 
                  border: '1px solid #ddd', 
                  padding: '10px', 
                  marginBottom: '10px',
                  borderRadius: '4px'
                }}>
                  <p><strong>Amount:</strong> {tx.amount} {tx.currency.currency}</p>
                  <p><strong>Status:</strong> {tx.status}</p>
                  <p><strong>From:</strong> {tx.sender}</p>
                  <p><strong>To:</strong> {tx.recipient}</p>
                  {tx.block_number && <p><strong>Block:</strong> {tx.block_number}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentComponent;