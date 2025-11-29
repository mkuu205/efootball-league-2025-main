// api/payflow.js - PayFlow Payment Integration for Node.js/Express

// PayFlow API Configuration (from environment variables)
const PAYFLOW_CONFIG = {
    API_KEY: process.env.PAYFLOW_API_KEY || 'b384cf784c99b3487c8bcadcec9d83075ba765b571de65dc6de112c240bf6cd8',
    API_SECRET: process.env.PAYFLOW_API_SECRET || 'f3e6f274170b19e1ffc406db4a2d8c91c19d5d923792f6dfd732cc999ee72abf',
    ACCOUNT_ID: process.env.PAYFLOW_ACCOUNT_ID || 3,
    BASE_URL: 'https://payflow.top/api/v2',
    STK_PUSH_URL: 'https://payflow.top/api/v2/stkpush.php',
    STATUS_URL: 'https://payflow.top/api/v2/status.php'
};

// Fixed amount constant
const FIXED_AMOUNT = 52;

export default function payflowRoutes(app, supabaseAdmin) {
    
    // POST /api/payflow/stk-push - Initiate STK Push
    app.post('/api/payflow/stk-push', async (req, res) => {
        try {
            const { phone, reference, description, account_id, tournament_id } = req.body;

            // Validate input - phone is required, amount is fixed to 52
            if (!phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number is required'
                });
            }

            // Validate phone format
            const phoneRegex = /^254\d{9}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone must be in format 254XXXXXXXXX'
                });
            }

            console.log(`📱 Initiating STK Push to ${phone} for fixed amount KES ${FIXED_AMOUNT}...`);

            // Send STK Push to PayFlow
            const response = await fetch(PAYFLOW_CONFIG.STK_PUSH_URL, {
                method: 'POST',
                headers: {
                    'X-API-Key': PAYFLOW_CONFIG.API_KEY,
                    'X-API-Secret': PAYFLOW_CONFIG.API_SECRET,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    payment_account_id: PAYFLOW_CONFIG.ACCOUNT_ID,
                    phone: phone,
                    amount: FIXED_AMOUNT,
                    reference: reference || `EFL_${Date.now()}`,
                    description: description || 'eFootball League 2025 Payment'
                })
            });

            const result = await response.json();
            console.log('📡 PayFlow Response:', result);

            if (result.success) {
                // Store payment request in database
                if (account_id) {
                    await supabaseAdmin
                        .from('payments')
                        .insert([{
                            player_account_id: account_id,
                            amount: FIXED_AMOUNT,
                            phone: phone,
                            reference: reference,
                            checkout_request_id: result.checkout_request_id,
                            merchant_request_id: result.merchant_request_id,
                            status: 'pending',
                            payment_type: tournament_id ? 'tournament' : 'registration',
                            tournament_id: tournament_id || null,
                            created_at: new Date().toISOString()
                        }]);
                }

                res.json({
                    success: true,
                    message: 'STK Push sent successfully',
                    amount: FIXED_AMOUNT,
                    checkout_request_id: result.checkout_request_id,
                    merchant_request_id: result.merchant_request_id
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.message || 'Failed to send STK Push'
                });
            }

        } catch (error) {
            console.error('❌ STK Push error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error: ' + error.message
            });
        }
    });

    // POST /api/payflow/status - Check payment status
    app.post('/api/payflow/status', async (req, res) => {
        try {
            const { checkout_request_id } = req.body;

            if (!checkout_request_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Checkout request ID is required'
                });
            }

            console.log(`🔍 Checking payment status for: ${checkout_request_id}`);

            const response = await fetch(PAYFLOW_CONFIG.STATUS_URL, {
                method: 'POST',
                headers: {
                    'X-API-Key': PAYFLOW_CONFIG.API_KEY,
                    'X-API-Secret': PAYFLOW_CONFIG.API_SECRET,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    checkout_request_id: checkout_request_id
                })
            });

            const result = await response.json();
            console.log('📡 Status Response:', result);

            if (result.success) {
                // Update payment record if completed
                if (result.status === 'completed') {
                    await supabaseAdmin
                        .from('payments')
                        .update({
                            status: 'completed',
                            transaction_code: result.transaction_code,
                            completed_at: new Date().toISOString()
                        })
                        .eq('checkout_request_id', checkout_request_id);

                    // Also update player account
                    const { data: payment } = await supabaseAdmin
                        .from('payments')
                        .select('id, player_account_id, tournament_id')
                        .eq('checkout_request_id', checkout_request_id)
                        .single();

                    if (payment && !payment.tournament_id) {
                        // Only update player account for registration payments
                        await supabaseAdmin
                            .from('player_accounts')
                            .update({
                                payment_status: 'completed',
                                payment_date: new Date().toISOString(),
                                transaction_code: result.transaction_code
                            })
                            .eq('id', payment.player_account_id);
                    }
                    
                    // Store payment_id for response
                    var paymentId = payment?.id;
                }

                res.json({
                    success: true,
                    status: result.status,
                    transaction_code: result.transaction_code,
                    message: result.message,
                    payment_id: paymentId || null
                });
            } else {
                res.json({
                    success: false,
                    message: result.message || 'Failed to check status'
                });
            }

        } catch (error) {
            console.error('❌ Status check error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error: ' + error.message
            });
        }
    });

    // POST /api/payflow/webhook - PayFlow callback webhook
    app.post('/api/payflow/webhook', async (req, res) => {
        try {
            console.log('📞 PayFlow Webhook received:', JSON.stringify(req.body, null, 2));

            const data = req.body.data || req.body;
            
            const checkoutRequestId = data.checkout_request_id || data.CheckoutRequestID;
            const resultCode = data.result_code ?? data.ResultCode;
            const transactionCode = data.transaction_code || data.MpesaReceiptNumber;
            const amount = data.amount || data.Amount;
            const phone = data.phone_number || data.phone;

            // Check if payment was successful
            const isSuccess = resultCode === 0 || resultCode === '0' || 
                             data.status === 'completed' || data.status === 'success';

            if (isSuccess && checkoutRequestId) {
                console.log(`✅ Payment successful: ${transactionCode}`);

                // Update payment record
                await supabaseAdmin
                    .from('payments')
                    .update({
                        status: 'completed',
                        transaction_code: transactionCode,
                        completed_at: new Date().toISOString()
                    })
                    .eq('checkout_request_id', checkoutRequestId);

                // Get payment to find account
                const { data: payment } = await supabaseAdmin
                    .from('payments')
                    .select('player_account_id')
                    .eq('checkout_request_id', checkoutRequestId)
                    .single();

                if (payment) {
                    // Update player account
                    await supabaseAdmin
                        .from('player_accounts')
                        .update({
                            payment_status: 'completed',
                            payment_date: new Date().toISOString(),
                            transaction_code: transactionCode,
                            status: 'pending_profile'
                        })
                        .eq('id', payment.player_account_id);

                    console.log(`✅ Account ${payment.player_account_id} payment confirmed`);
                }
            } else {
                console.log(`❌ Payment failed or pending: ${data.result_desc || data.ResultDesc}`);
                
                if (checkoutRequestId) {
                    await supabaseAdmin
                        .from('payments')
                        .update({
                            status: 'failed',
                            error_message: data.result_desc || data.ResultDesc
                        })
                        .eq('checkout_request_id', checkoutRequestId);
                }
            }

            // Always respond with success to PayFlow
            res.json({ status: 'success', message: 'Webhook processed' });

        } catch (error) {
            console.error('❌ Webhook error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    });

    console.log('✅ PayFlow payment routes registered');
}