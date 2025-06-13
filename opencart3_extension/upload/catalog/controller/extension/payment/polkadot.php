<?php
class ControllerExtensionPaymentPolkadot extends Controller {
    public function index() {
        // $this->load->language('extension/polkadot/payment/polkadot');
        $data['button_confirm'] = $this->language->get('button_confirm');
        $this->load->model('checkout/order');
        if(
            !isset($this->session->data['order_id'])
            || !isset($this->session->data['payment_method'])
        ) return false;
        $order_info = $this->model_checkout_order->getOrder($this->session->data['order_id']);

        $data['datas_order'] = $this->session->data['order_id'];
        $data['datas_total'] = $order_info['total'];
        $data['datas_currency'] = $order_info['currency_code'];
        $data['datas_currences'] = $this->config->get('payment_polkadot_currences');

        // $this->currency->format($order_info['total'], $order_info['currency_code'], $order_info['currency_value'], false);
        //   $data['datas_total']=($order_info? 1*$order_info["total"] : 'error');
        // $data['datas_merchant'] = $this->config->get('payment_polkadot_merchant'); // payment_polkadot_security
        // $data['datas_wss'] = $this->config->get('payment_polkadot_engineurl');
        $data['language'] = $this->config->get('config_language');
        //   $data['logged'] = $this->customer->isLogged();
        //   $data['subscription'] = $this->cart->hasSubscription();
        // $data['ap_itemname'] = $this->config->get('config_name') . ' - #' . $this->session->data['order_id'];  // Your Store - #15
        $data['datas_success_callback'] = $this->url->link('checkout/success');             // https://opencart3.zymologia.fi/index.php?route=checkout/success
        $data['datas_cancel_callback'] = $this->url->link('checkout/checkout', '', true);  // https://opencart3.zymologia.fi/index.php?route=checkout/checkout

        // Ensure user_token exists in session before using it
        $user_token = isset($this->session->data['user_token']) ? $this->session->data['user_token'] : '';
        // If user_token is essential and might be missing, add error handling or alternative logic here.
        // For now, we proceed, but the URL might be incomplete if token is missing.
        if (empty($user_token)) {
            $this->log->write('Warning: user_token not found in session for Polkadot payment confirm URL.');
            // Decide how to handle this - maybe disable the button or show an error?
            // For now, the URL will be generated without the token.
        }

        $data['ajax_url'] = HTTP_SERVER . 'index.php?route=extension/payment/polkadot/confirm&user_token=' . $user_token;


        return $this->load->view('extension/payment/polkadot', $data);
    }

    public function callback() {
        // Basic logging for callback attempts
        $this->log->write('Polkadot Callback Received: ' . print_r($this->request->post, true));

        // Check if 'security' key exists and matches config. Note: Daemon doesn't send this by default.
        // This part might need adjustment based on actual daemon callback payload.
        // if (isset($this->request->post['security']) && ($this->request->post['security'] == $this->config->get('payment_polkadot_security'))) {

        // Let's assume the daemon sends the order ID and status in the callback payload
        // Adjust these keys based on the actual payload structure from Kalatori daemon callbacks
        $order_id_key = 'order'; // Example key, check daemon spec/logs for actual key
        $status_key = 'payment_status'; // Example key

        if (isset($this->request->post[$order_id_key]) && isset($this->request->post[$status_key])) {
            $order_id = $this->request->post[$order_id_key];
            // Extract the numeric order ID if it has a prefix like "oc3_"
            if (strpos($order_id, 'oc3_') === 0) {
                $parts = explode('_', $order_id);
                $order_id = end($parts); // Get the last part, assuming it's the numeric ID
            }
            $order_id = (int)$order_id; // Ensure it's an integer

            $payment_status = strtolower($this->request->post[$status_key]);

            if ($order_id > 0 && $payment_status == 'paid') {
                $this->log->write('Polkadot Callback: Processing successful payment for Order ID ' . $order_id);

                $this->load->model('checkout/order');
                $target_status_id = (int)$this->config->get('payment_polkadot_order_status_id');

                // Check current order status to prevent duplicate history entries
                $order_info = $this->model_checkout_order->getOrder($order_id);
                if ($order_info && $order_info['order_status_id'] != $target_status_id) {
                    $this->model_checkout_order->addOrderHistory($order_id, $target_status_id, 'Payment confirmed via Kalatori callback.', true); // Notify customer
                    $this->log->write('Polkadot Callback: Updated Order ID ' . $order_id . ' to status ' . $target_status_id);
                } else {
                    $this->log->write('Polkadot Callback: Order ID ' . $order_id . ' already at target status or not found.');
                }
            } else {
                $this->log->write('Polkadot Callback: Received non-paid status or invalid order ID for Order ID ' . $order_id . '. Status: ' . $payment_status);
            }
        } else {
            $this->log->write('Polkadot Callback: Received incomplete data. Missing order ID or payment status.');
        }
    }




// ==============================================================
    public function confirm() {

        // Helper function to output JSON
        function json_ok($controller_instance, $data) {
            // Ensure error/helper keys potentially added by ajax() are removed before sending to frontend
            unset($data['error']);
            unset($data['http_code_dot']);
            $controller_instance->response->addHeader('Content-Type: application/json'); // Use application/json
            $controller_instance->response->setOutput(json_encode($data));
        }

        // Helper function to output JSON error (standardized structure)
        function json_err($controller_instance, $error_message) {
            $error_data = array('error' => $error_message);
            $controller_instance->response->addHeader('Content-Type: application/json');
            $controller_instance->response->setOutput(json_encode($error_data));
        }

        $url = $this->config->get('payment_polkadot_engineurl');
        if (empty($url)) {
            $this->log->write('ERROR: Kalatori payment_polkadot_engineurl is not configured.');
            return json_err($this, 'Payment gateway configuration error.');
        }

        // --- Status Check Endpoint ---
        if(isset($_GET['endpoint']) && $_GET['endpoint'] == 'status') {
            $status_url = rtrim($url, '/') . "/v2/status";
            $this->log->write("Kalatori Status Check URL: " . $status_url);
            $r = $this->ajax($status_url); // Pass only the URL for GET request
            // Check response from ajax before outputting
            if (isset($r['error'])) {
                $this->log->write("Kalatori Status Check Error: " . $r['error']);
                return json_err($this, "Error checking gateway status: " . $r['error']);
            }
            $this->log->write("Kalatori Status Check Response: " . print_r($r, true));
            return json_ok($this, $r); // Use json_ok to ensure correct headers and format
        }

        // --- Order Processing/Polling Endpoint ---

        // Check essential session data
        if ( !isset($this->session->data['order_id']) ) {
            $this->log->write('ERROR: Kalatori confirm() called without order_id in session.');
            return json_err($this, 'Error: Order ID not found in session.');
        }
        $order = $this->session->data['order_id'];
        if( !$order ) {
            $this->log->write('ERROR: Kalatori confirm() order_id is invalid.');
            return json_err($this, 'Error: Invalid Order ID.');
        }

        // Check currency parameter from frontend
        if ( !isset($_GET['currency']) || empty($_GET['currency']) ) {
            $this->log->write('ERROR: Kalatori confirm() called without currency parameter.');
            return json_err($this, 'Error: Currency parameter missing.');
        }
        $currency = $_GET['currency'];


        $this->load->model('checkout/order');
        $order_info = $this->model_checkout_order->getOrder($order);
        if (!$order_info) {
            $this->log->write('ERROR: Kalatori confirm() failed to getOrder for ID: ' . $order);
            return json_err($this, 'Error: Could not retrieve order details.');
        }

        $amount = $order_info["total"];
        $shop_name = $this->config->get('payment_polkadot_shopname'); // Renamed variable
        $opencart_currency_code = $order_info['currency_code']; // Currency from OpenCart order

        // --- Currency Validation ---
        // 1. Check against allowed currencies in config (if set)
        $allowed_currences = $this->config->get('payment_polkadot_currences');
        if(!empty($allowed_currences)) {
            $allowed_currences = str_replace(',', ' ', $allowed_currences);
            $allowed_array = preg_split('/\s+/', $allowed_currences, -1, PREG_SPLIT_NO_EMPTY); // Split by space, handle multiple spaces
            $allowed_array = array_map('trim', $allowed_array);
            if(!in_array($currency, $allowed_array)) {
                $this->log->write('ERROR: Kalatori currency check failed. Requested: ' . $currency . ', Allowed: ' . implode(', ', $allowed_array));
                return json_err($this, 'Error: Selected currency (' . $currency . ') is not allowed.');
            }
        }
        // 2. Basic check if requested currency starts with OpenCart order currency (e.g., USD vs USDC)
        // This might be too simplistic depending on your needs. Consider exact match if necessary.
        if(strpos($currency, $opencart_currency_code) !== 0) {
            $this->log->write('ERROR: Kalatori currency mismatch. Order: ' . $opencart_currency_code . ', Requested: ' . $currency);
            // Consider if this check is still needed or should be stricter
            // return json_err($this, 'Error: Currency mismatch between order and selection.');
        }
        // --- End Currency Validation ---


        // Construct the Kalatori API URL for the specific order
        $order_api_id = "oc3_" . urlencode((empty($shop_name) ? '' : $shop_name . '_') . $order);
        $order_url = rtrim($url, '/') . "/v2/order/" . $order_api_id;

        // Data payload for the POST request
        $data = array(
            'currency' => $currency,
            'amount' => (float)$amount // Ensure amount is float
        );

        // --- Log Request ---
        $log_message = "--- Kalatori Order Request ---" . PHP_EOL;
        $log_message .= "Timestamp: " . date('Y-m-d H:i:s') . PHP_EOL;
        $log_message .= "Target URL: " . $order_url . PHP_EOL;
        $log_message .= "Request Method: POST" . PHP_EOL;
        $log_message .= "Request Data JSON: " . json_encode($data) . PHP_EOL;
        $this->log->write($log_message);
        // --- End Log Request ---

        $r = $this->ajax($order_url, $data); // A J A X Call

        // --- Log Response ---
        $log_message = "Kalatori Order Response: " . print_r($r, true) . PHP_EOL;
        $this->log->write($log_message);
        // --- End Log Response ---

        // --- Process Response ---
        // Check for critical errors first (network, parsing, non-409 HTTP errors)
        if(isset($r['error']) && (!isset($r['http_code_dot']) || $r['http_code_dot'] != 409)) {
            $this->log->write("Kalatori Error (Non-409) for Order ID " . $order . ": " . $r['error']);
            // Return the error structure directly to the frontend
            $this->response->addHeader('Content-Type: application/json');
            $this->response->setOutput(json_encode($r));
            return; // Stop processing
        }

        // Handle the 409 Conflict specifically OR a successful 200/201 response
        // If we got a 409, the body *should* contain the current status.
        // If we got 200/201, the body contains the status.
        // In either case, check the payment_status in the response body.
        if(isset($r['payment_status']) && strtolower($r['payment_status']) == 'paid') {
            // Payment is confirmed (either from a 200/201 or the body of a 409)
            $this->log->write("Kalatori Payment Confirmed for Order ID: " . $order);

            // Update OpenCart order status ONLY IF IT'S NOT ALREADY the target status
            $target_status_id = (int)$this->config->get('payment_polkadot_order_status_id');
            if (empty($target_status_id)) {
                $this->log->write("Warning: payment_polkadot_order_status_id is not set in config. Using default status 2 (Processing).");
                $target_status_id = 2; // Default to 'Processing' if not set
            }

            // Check current status before updating
            $current_status_query = $this->db->query("SELECT order_status_id FROM `" . DB_PREFIX . "order` WHERE order_id = '" . (int)$order . "'");

            if ($current_status_query->num_rows && $current_status_query->row['order_status_id'] != $target_status_id) {
                $this->model_checkout_order->addOrderHistory($order, $target_status_id, 'Payment confirmed by Kalatori.', false); // Last param false = do not notify customer from here (success page will do)
                $this->log->write("OpenCart Order History Updated for Order ID: " . $order . " to Status ID: " . $target_status_id);
            } else {
                $this->log->write("OpenCart Order History NOT Updated for Order ID: " . $order . " (Already at target status " . $target_status_id . " or order not found)");
            }

            // Prepare success response for frontend
            $r['redirect'] = $this->url->link('checkout/success', 'language=' . $this->config->get('config_language'), true);
            return json_ok($this, $r); // Send success JSON (with redirect) to frontend
        }

        // If it wasn't an error (excluding 409) and wasn't 'paid', it's likely still 'pending' or some other status.
        // Return the current status received from the daemon.
        return json_ok($this, $r); // Send current status (e.g., pending) to frontend
    }


    // Handles cURL requests to the Kalatori daemon
    function ajax($url, $data = false) {
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5); // Increased connect timeout
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);       // Increased total timeout
        curl_setopt($ch, CURLOPT_FAILONERROR, false); // Set to false to handle HTTP errors manually
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json', 'Accept: application/json'));
        // It's generally safer to verify SSL certificates
        // curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        // curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        // If using self-signed certs for testing (NOT recommended for production):
        // curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        // curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);


        if($data !== false) { // Check explicitly for false, as GET requests won't pass data
            curl_setopt($ch, CURLOPT_POST, true); // Use CURLOPT_POST for POST requests
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            // CURLOPT_CUSTOMREQUEST is not needed when using CURLOPT_POST
        } else {
            curl_setopt($ch, CURLOPT_HTTPGET, true); // Explicitly set GET if no data
        }

        $response_body = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $curl_error_num = curl_errno($ch);
        $curl_error_msg = curl_error($ch);

        curl_close($ch);

        // Check for cURL errors first
        if ($curl_error_num) {
            $this->log->write("Kalatori cURL Error: #" . $curl_error_num . " - " . $curl_error_msg . " URL: " . $url);
            return array('error' => "Gateway communication error (cURL): " . $curl_error_msg, 'http_code_dot' => 0); // Indicate connection failure
        }

        // Check if response body is empty (might happen on certain errors)
        if (empty($response_body)) {
            $this->log->write("Kalatori Error: Empty response received. HTTP Code: " . $http_code . " URL: " . $url);
            // Provide a more specific error if possible based on HTTP code
            $error_msg = "Gateway communication error: Empty response.";
            if ($http_code >= 400) {
                $error_msg = "Gateway error: Empty response (HTTP " . $http_code . ")";
            }
            return array('error' => $error_msg, 'http_code_dot' => $http_code);
        }

        // Attempt to decode JSON response
        $decoded_response = json_decode($response_body, true); // Decode as associative array

        // Check for JSON decoding errors
        if ($decoded_response === null && json_last_error() !== JSON_ERROR_NONE) {
            $this->log->write("Kalatori JSON Decode Error: " . json_last_error_msg() . ". Raw Response: " . $response_body . " URL: " . $url);
            return array('error' => "Gateway response error: Invalid format.", 'http_code_dot' => $http_code);
        }

        // Add the HTTP code to the decoded response array
        // This allows the calling function (confirm) to check it
        $decoded_response['http_code_dot'] = $http_code;

        // If HTTP status indicates an error (>= 400), BUT it's not a 409 (which we handle specially later),
        // add an 'error' key for basic frontend handling, but still return the body.
        // The main logic in confirm() will decide how to proceed based on the code.
        if ($http_code >= 400 && $http_code != 409) {
            $decoded_response['error'] = "Gateway returned HTTP error: " . $http_code;
            // Optionally log the body of the error response from the daemon
            $this->log->write("Kalatori HTTP Error Response Body (Code " . $http_code . "): " . $response_body);
        }
        // For 409 Conflict, we specifically DO NOT add the 'error' key here,
        // because the confirm() function needs to check the body for 'paid' status.

        return $decoded_response;
    }


    // DELETE (kept for reference, but logging should use $this->log->write())
    function logs($s='') {
        // Example using OpenCart logger:
        // $this->log->write("Polkadot Debug: " . $s);
    }

}