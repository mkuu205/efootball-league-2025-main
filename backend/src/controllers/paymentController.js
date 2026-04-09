import db from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { initiateSTKPush, checkPaymentStatus, processSuccessfulPayment, processFailedPayment } from '../services/payflowService.js';

const paymentController = {
  // POST /api/payflow/stk-push
  initiatePayment: async (req, res) => {
    try {
      const { phone, amount, tournament_id } = req.body;

      if (!phone || !amount) {
        return errorResponse(res, 'Phone number and amount are required', 400);
      }

      // Validate phone format (Kenyan)
      const phoneRegex = /^(?:254|\+254|0)?([17]\d{8})$/;
      const phoneMatch = phone.match(phoneRegex);
      
      if (!phoneMatch) {
        return errorResponse(res, 'Invalid phone number format', 400);
      }

      const formattedPhone = `254${phoneMatch[1]}`;

      // Create payment transaction
      const transactionResult = await db.query(
        `INSERT INTO payment_transactions (player_id, tournament_id, amount, phone, status) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.user.id, tournament_id || null, amount, formattedPhone, 'pending']
      );

      const transaction = transactionResult.rows[0];

      // Get tournament name for description
      let tournamentName = 'Tournament Entry';
      if (tournament_id) {
        const tournamentResult = await db.query(
          'SELECT name FROM tournaments WHERE id = $1',
          [tournament_id]
        );
        if (tournamentResult.rows.length > 0) {
          tournamentName = tournamentResult.rows[0].name;
        }
      }

      // Initiate STK Push
      const stkResult = await initiateSTKPush({
        phone: formattedPhone,
        amount: amount,
        accountId: `EFL-${transaction.id}`,
        transactionDesc: tournamentName
      });

      // Update transaction with checkout request ID
      await db.query(
        'UPDATE payment_transactions SET checkout_request_id = $1, merchant_request_id = $2 WHERE id = $3',
        [stkResult.checkoutRequestId, stkResult.merchantRequestId, transaction.id]
      );

      successResponse(res, 'STK Push sent successfully', {
        transaction_id: transaction.id,
        checkout_request_id: stkResult.checkoutRequestId
      });
    } catch (error) {
      console.error('❌ Initiate payment error:', error);
      errorResponse(res, error.message || 'Failed to initiate payment', 500);
    }
  },

  // POST /api/payflow/status
  checkStatus: async (req, res) => {
    try {
      const { transaction_id } = req.body;

      if (!transaction_id) {
        return errorResponse(res, 'Transaction ID is required', 400);
      }

      // Get transaction
      const transactionResult = await db.query(
        'SELECT * FROM payment_transactions WHERE id = $1 AND player_id = $2',
        [transaction_id, req.user.id]
      );

      if (transactionResult.rows.length === 0) {
        return errorResponse(res, 'Transaction not found', 404);
      }

      const transaction = transactionResult.rows[0];

      // If already completed, return immediately
      if (transaction.status === 'completed') {
        return successResponse(res, 'Payment completed', {
          status: 'completed',
          transaction_code: transaction.transaction_code,
          amount: transaction.amount
        });
      }

      // If failed, return immediately
      if (transaction.status === 'failed') {
        return successResponse(res, 'Payment failed', {
          status: 'failed',
          error: transaction.error_message
        });
      }

      // Check with PayFlow API
      const payflowStatus = await checkPaymentStatus(transaction.checkout_request_id);

      // Handle response
      if (payflowStatus.ResultCode === '0') {
        // Payment successful
        await processSuccessfulPayment(transaction, payflowStatus);
        
        return successResponse(res, 'Payment completed successfully', {
          status: 'completed',
          transaction_code: payflowStatus.MpesaReceiptNumber || transaction.transaction_code,
          amount: transaction.amount
        });
      } else if (payflowStatus.ResultCode) {
        // Payment failed
        await processFailedPayment(transaction, payflowStatus.ResultDesc);
        
        return successResponse(res, 'Payment failed', {
          status: 'failed',
          error: payflowStatus.ResultDesc
        });
      }

      // Still pending
      successResponse(res, 'Payment pending', {
        status: 'pending'
      });
    } catch (error) {
      console.error('❌ Check payment status error:', error);
      errorResponse(res, 'Failed to check payment status', 500);
    }
  },

  // POST /api/payflow/webhook
  webhook: async (req, res) => {
    try {
      const callback = req.body;

      console.log('📥 PayFlow Webhook received:', JSON.stringify(callback, null, 2));

      // Extract data from callback
      const { Body } = callback;
      if (!Body || !Body.stkCallback) {
        return res.status(400).json({ error: 'Invalid callback format' });
      }

      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = Body.stkCallback;

      // Find transaction
      const transactionResult = await db.query(
        'SELECT * FROM payment_transactions WHERE checkout_request_id = $1',
        [CheckoutRequestID]
      );

      if (transactionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const transaction = transactionResult.rows[0];

      // Process based on result code
      if (ResultCode === 0) {
        // Extract payment details
        const callbackMetadata = Body.stkCallback.CallbackMetadata || {};
        const paymentDetails = {};
        
        if (callbackMetadata.Item) {
          callbackMetadata.Item.forEach(item => {
            paymentDetails[item.Name] = item.Value;
          });
        }

        await processSuccessfulPayment(transaction, paymentDetails);
      } else {
        await processFailedPayment(transaction, ResultDesc);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },

  // GET /api/receipt/:id
  getReceipt: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT pt.*, pa.username, pa.email, pa.team, t.name as tournament_name
         FROM payment_transactions pt
         LEFT JOIN player_accounts pa ON pt.player_id = pa.id
         LEFT JOIN tournaments t ON pt.tournament_id = t.id
         WHERE pt.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Transaction not found', 404);
      }

      const payment = result.rows[0];

      if (payment.status !== 'completed') {
        return errorResponse(res, 'Payment not completed', 400);
      }

      // Return receipt data (frontend will generate PDF)
      successResponse(res, 'Receipt retrieved', {
        id: payment.id,
        transaction_code: payment.transaction_code,
        amount: payment.amount,
        phone: payment.phone,
        tournament_name: payment.tournament_name || 'N/A',
        player_name: payment.username,
        email: payment.email,
        team: payment.team,
        completed_at: payment.completed_at,
        status: payment.status
      });
    } catch (error) {
      console.error('❌ Get receipt error:', error);
      errorResponse(res, 'Failed to get receipt', 500);
    }
  }
};

export default paymentController;
