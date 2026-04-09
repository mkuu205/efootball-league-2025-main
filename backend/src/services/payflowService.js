import axios from 'axios';
import db from '../config/db.js';
import { createNotification } from './notificationService.js';

// PayFlow configuration
const PAYFLOW_CONFIG = {
  consumerKey: process.env.PAYFLOW_CONSUMER_KEY,
  consumerSecret: process.env.PAYFLOW_CONSUMER_SECRET,
  shortcode: process.env.PAYFLOW_SHORTCODE,
  passkey: process.env.PAYFLOW_PASSKEY,
  callbackUrl: process.env.PAYFLOW_CALLBACK_URL,
  baseUrl: process.env.PAYFLOW_BASE_URL || 'https://api.payflow.com'
};

// Generate authentication token
export const generateAuthToken = async () => {
  try {
    const auth = Buffer.from(`${PAYFLOW_CONFIG.consumerKey}:${PAYFLOW_CONFIG.consumerSecret}`).toString('base64');
    
    const response = await axios.get(`${PAYFLOW_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error generating PayFlow auth token:', error.response?.data || error.message);
    throw new Error('Failed to generate authentication token');
  }
};

// Initiate STK Push
export const initiateSTKPush = async ({ phone, amount, accountId, transactionDesc }) => {
  try {
    const accessToken = await generateAuthToken();
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, -5);
    const password = Buffer.from(`${PAYFLOW_CONFIG.shortcode}${PAYFLOW_CONFIG.passkey}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: PAYFLOW_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: PAYFLOW_CONFIG.shortcode,
      PhoneNumber: phone,
      CallBackURL: PAYFLOW_CONFIG.callbackUrl,
      AccountReference: accountId || 'eFootball',
      TransactionDesc: transactionDesc || 'Tournament Entry Fee'
    };

    const response = await axios.post(
      `${PAYFLOW_CONFIG.baseUrl}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      message: 'STK Push sent successfully'
    };
  } catch (error) {
    console.error('❌ Error initiating STK Push:', error.response?.data || error.message);
    throw new Error('Failed to initiate STK Push');
  }
};

// Check payment status
export const checkPaymentStatus = async (checkoutRequestId) => {
  try {
    const accessToken = await generateAuthToken();
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, -5);
    const password = Buffer.from(`${PAYFLOW_CONFIG.shortcode}${PAYFLOW_CONFIG.passkey}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: PAYFLOW_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    const response = await axios.post(
      `${PAYFLOW_CONFIG.baseUrl}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('❌ Error checking payment status:', error.response?.data || error.message);
    throw new Error('Failed to check payment status');
  }
};

// Process successful payment
export const processSuccessfulPayment = async (transaction, paymentDetails) => {
  try {
    // Update transaction status
    await db.query(
      'UPDATE payment_transactions SET status = $1, transaction_code = $2, completed_at = NOW() WHERE id = $3',
      ['completed', paymentDetails.MpesaReceiptNumber || transaction.transaction_code, transaction.id]
    );

    // Add player to tournament if applicable
    if (transaction.tournament_id) {
      await db.query(
        'INSERT INTO tournament_participants (tournament_id, player_id, payment_status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [transaction.tournament_id, transaction.player_id, 'completed']
      );

      // Get tournament name for notification
      const tournamentResult = await db.query(
        'SELECT name FROM tournaments WHERE id = $1',
        [transaction.tournament_id]
      );

      if (tournamentResult.rows.length > 0) {
        // Send notification
        await createNotification({
          user_id: transaction.player_id,
          title: 'Payment Successful',
          message: `Payment of KES ${transaction.amount} for ${tournamentResult.rows[0].name} completed. You have joined the tournament!`,
          type: 'payment'
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error processing successful payment:', error);
    throw error;
  }
};

// Process failed payment
export const processFailedPayment = async (transaction, errorMessage) => {
  try {
    await db.query(
      'UPDATE payment_transactions SET status = $1, error_message = $2 WHERE id = $3',
      ['failed', errorMessage, transaction.id]
    );

    return { success: true };
  } catch (error) {
    console.error('❌ Error processing failed payment:', error);
    throw error;
  }
};
