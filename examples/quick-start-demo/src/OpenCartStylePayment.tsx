import React, { useState, useEffect } from 'react';

// OpenCart-style Kalatori payment interface adapted from the original extension
const OpenCartStylePayment: React.FC = () => {
  const [step, setStep] = useState<'loading' | 'currency' | 'payment' | 'monitoring' | 'success'>('loading');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USDC');
  const [order, setOrder] = useState<any>(null);
  const [daemonInfo, setDaemonInfo] = useState<any>(null);
  const [paymentAccount, setPaymentAccount] = useState<string>('');
  const [monitoringCount, setMonitoringCount] = useState<number>(0);

  // Mock daemon data (same structure as OpenCart extension)
  const mockDaemonData = {
    server_info: {
      version: "0.3.1",
      instance_id: "demo-instance",
      debug: true
    },
    supported_currencies: {
      DOT: {
        chain_name: "polkadot",
        kind: "native",
        decimals: 10,
        rpc_url: "wss://chopsticks.dot.reloket.com"
      },
      USDC: {
        chain_name: "statemint", 
        kind: "asset",
        asset_id: 1337,
        decimals: 6,
        rpc_url: "wss://chopsticks.ah.reloket.com"
      },
      USDt: {
        chain_name: "statemint",
        kind: "asset",
        asset_id: 1984,
        decimals: 6,
        rpc_url: "wss://chopsticks.ah.reloket.com"
      }
    }
  };

  useEffect(() => {
    // Simulate loading daemon info
    setTimeout(() => {
      setDaemonInfo(mockDaemonData);
      setStep('currency');
    }, 1500);
  }, []);

  const handleCurrencySelect = (currency: string) => {
    setSelectedCurrency(currency);
    setStep('payment');
  };

  const handleCreateOrder = () => {
    // Simulate order creation
    const mockOrder = {
      order: `demo_${Date.now()}`,
      payment_status: "pending",
      payment_account: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
      amount: 10.0,
      currency: selectedCurrency,
      total_min: "10.04", // Including fees
      fee: "0.04"
    };
    
    setOrder(mockOrder);
    setPaymentAccount(mockOrder.payment_account);
    setStep('monitoring');
    startMonitoring();
  };

  const startMonitoring = () => {
    const interval = setInterval(() => {
      setMonitoringCount(prev => {
        const newCount = prev + 1;
        if (newCount >= 5) {
          clearInterval(interval);
          setStep('success');
          return newCount;
        }
        return newCount;
      });
    }, 2000);
  };

  return (
    <div style={styles.container}>
      <div className="kco-container" style={styles.kcoContainer}>
        
        {step === 'loading' && (
          <div style={styles.loadingSection}>
            <div style={styles.spinner}>⟳</div>
            <div>Loading Kalatori engine...</div>
          </div>
        )}

        {step === 'currency' && (
          <section id="sv-section-selectCurrency" style={styles.section}>
            <div style={styles.payWithText}>Kalatori pay with</div>
            <div id="sv-CUR" style={styles.currencySelect}>
              {Object.keys(mockDaemonData.supported_currencies).map(currency => (
                <button
                  key={currency}
                  onClick={() => handleCurrencySelect(currency)}
                  style={{
                    ...styles.currencyButton,
                    ...(selectedCurrency === currency ? styles.currencyButtonSelected : {})
                  }}
                >
                  {currency}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 'payment' && (
          <>
            <section id="sv-section-aboutPayment" style={styles.section}>
              <div style={styles.priceRow}>
                <span style={styles.price}>
                  <span className="cx-total">10.00</span> <span className="cx-symbol">{selectedCurrency}</span>
                </span>
                <div style={styles.priceDetails}>
                  <div>+ fees: 0.04 {selectedCurrency}</div>
                  <div style={styles.totalPrice}>Total: 10.04 {selectedCurrency}</div>
                </div>
              </div>
            </section>

            <section id="sv-section-payManual" style={styles.section}>
              <div style={styles.manualPayTitle}>
                <span style={styles.chevron}>▶</span>
                <span style={styles.titleText}>Pay from external wallet</span>
              </div>
              
              <button
                onClick={handleCreateOrder}
                style={styles.createOrderButton}
              >
                Create Payment Order
              </button>
            </section>
          </>
        )}

        {step === 'monitoring' && order && (
          <section id="sv-section-monitoring" style={styles.section}>
            <div style={styles.successAlert}>
              <div style={styles.successTitle}>✅ Payment order created!</div>
              <div style={styles.orderDetails}>
                <div><strong>Order ID:</strong> {order.order}</div>
                <div><strong>Amount:</strong> {order.amount} {order.currency}</div>
                <div><strong>Payment Account:</strong></div>
                <div style={styles.paymentAccount}>{order.payment_account}</div>
              </div>
            </div>

            <div style={styles.monitoringAlert}>
              <div style={styles.monitoringTitle}>🔄 Monitoring payment...</div>
              <div>Check #{monitoringCount} of 5 (every 2 seconds)</div>
              <div style={styles.instructionText}>
                Send {order.total_min} {order.currency} to the payment account above
              </div>
            </div>
          </section>
        )}

        {step === 'success' && order && (
          <section id="sv-section-success" style={styles.section}>
            <div style={styles.successAlert}>
              <div style={styles.successTitle}>🎉 Payment completed!</div>
              <div>Your payment has been successfully confirmed on the blockchain.</div>
              
              <div style={styles.orderSummary}>
                <div><strong>Final Order Status:</strong></div>
                <div>Order ID: {order.order}</div>
                <div>Amount: {order.amount} {order.currency}</div>
                <div>Status: <span style={styles.paidStatus}>PAID</span></div>
              </div>
            </div>

            <button
              onClick={() => {
                setStep('currency');
                setOrder(null);
                setMonitoringCount(0);
              }}
              style={styles.newPaymentButton}
            >
              Start New Payment
            </button>
          </section>
        )}

      </div>
      
      <style dangerouslySetInnerHTML={{ __html: openCartCSS }} />
    </div>
  );
};

// Styles adapted from the original OpenCart extension CSS
const styles = {
  container: {
    fontFamily: 'Inter, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px'
  },
  kcoContainer: {
    maxWidth: '320px',
    margin: '0 auto',
    backgroundColor: '#fff',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '8px',
    padding: '20px'
  },
  loadingSection: {
    textAlign: 'center' as const,
    padding: '40px 20px'
  },
  spinner: {
    fontSize: '24px',
    animation: 'spin 1s linear infinite',
    marginBottom: '10px'
  },
  section: {
    marginBottom: '20px'
  },
  payWithText: {
    fontSize: '15px',
    color: '#555',
    marginBottom: '10px'
  },
  currencySelect: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const
  },
  currencyButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    backgroundColor: '#f8f9fa',
    color: '#333',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
    transition: 'all 0.2s ease'
  },
  currencyButtonSelected: {
    backgroundColor: '#000',
    color: '#fff',
    borderColor: '#000'
  },
  priceRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  price: {
    fontSize: '21px',
    fontWeight: '600' as const,
    color: '#222'
  },
  priceDetails: {
    fontSize: '13px',
    color: '#555'
  },
  totalPrice: {
    fontWeight: '600' as const,
    color: '#222'
  },
  manualPayTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '15px',
    cursor: 'pointer'
  },
  chevron: {
    fontSize: '12px',
    color: '#999'
  },
  titleText: {
    fontSize: '16px',
    fontWeight: '600' as const,
    color: '#222'
  },
  createOrderButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer'
  },
  successAlert: {
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '6px',
    padding: '15px',
    marginBottom: '15px'
  },
  successTitle: {
    color: '#155724',
    fontWeight: '600' as const,
    marginBottom: '10px'
  },
  orderDetails: {
    fontSize: '14px',
    color: '#155724',
    lineHeight: '1.4'
  },
  paymentAccount: {
    fontFamily: 'monospace',
    fontSize: '12px',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: '4px 6px',
    borderRadius: '3px',
    marginTop: '4px',
    wordBreak: 'break-all' as const
  },
  monitoringAlert: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '6px',
    padding: '15px',
    color: '#856404'
  },
  monitoringTitle: {
    fontWeight: '600' as const,
    marginBottom: '8px'
  },
  instructionText: {
    fontSize: '13px',
    fontStyle: 'italic' as const,
    marginTop: '8px'
  },
  orderSummary: {
    marginTop: '15px',
    fontSize: '14px',
    lineHeight: '1.4'
  },
  paidStatus: {
    color: '#28a745',
    fontWeight: '600' as const
  },
  newPaymentButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    marginTop: '15px'
  }
};

// CSS keyframes and additional styles from the original OpenCart extension
const openCartCSS = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.kco-container {
  font-family: Inter, sans-serif;
  font-feature-settings: 'liga' 1, 'calt' 1;
}

.kco-button:hover {
  background-color: #333 !important;
}

.kco-currency-button:hover {
  background-color: #e8e8f1 !important;
  border-color: #999 !important;
}

.flex-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.gap-small {
  gap: 8px;
}

.gap-medium {
  gap: 12px;
}

.t-price {
  font-size: 21px;
  font-weight: 600;
  color: #222;
}

.t-title {
  font-size: 16px;
  font-weight: 600;
  color: #222;
}

.kco-collapsable {
  transition: all 0.3s ease;
}

.kco-collapse-toggler {
  cursor: pointer;
  user-select: none;
}

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 16px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
}
`;

export default OpenCartStylePayment;