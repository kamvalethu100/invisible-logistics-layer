
import dotenv from 'dotenv';

dotenv.config();

class DarajaClient {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || 'stub_key';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || 'stub_secret';
    this.passkey = process.env.MPESA_PASSKEY || 'stub_passkey';
    this.shortcode = process.env.MPESA_SHORTCODE || '174379';
    this.b2cShortcode = process.env.MPESA_B2C_SHORTCODE || '600000';
    this.initiatorName = process.env.MPESA_INITIATOR_NAME || 'testapi';
    this.initiatorPassword = process.env.MPESA_INITIATOR_PASSWORD || 'testpassword';
    this.baseUrl = process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke';
    
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    if (this.consumerKey === 'stub_key') {
        return 'mock_access_token';
    }

    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    
    try {
      const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`
        }
      });
      
      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
      return this.accessToken;
    } catch (error) {
      console.error('[Daraja] Error getting access token:', error);
      throw new Error('Failed to authenticate with Daraja API');
    }
  }

  async stkPush({ phoneNumber, amount, callbackUrl, description, dataCategory = 'real' }) {
    console.log(`[Daraja] STK Push request for ${phoneNumber} - ${amount} KES [Category: ${dataCategory}]`);
    
    if (dataCategory !== 'real' || this.consumerKey === 'stub_key') {
      return {
        MerchantRequestID: `stub-${Date.now()}`,
        CheckoutRequestID: `stub-chk-${Date.now()}`,
        ResponseCode: '0',
        ResponseDescription: 'Success. Request accepted for processing',
        CustomerMessage: 'Success. Request accepted for processing'
      };
    }

    const token = await this.getAccessToken();
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const body = {
      BusinessShortCode: this.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: this.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: 'FlowGridDelivery',
      TransactionDesc: description || 'Delivery Payment'
    };

    try {
      const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      return await response.json();
    } catch (error) {
      console.error('[Daraja] STK Push error:', error);
      throw error;
    }
  }

  async b2cPayout({ phoneNumber, amount, callbackUrl, remarks, dataCategory = 'real' }) {
    console.log(`[Daraja] B2C Payout request for ${phoneNumber} - ${amount} KES [Category: ${dataCategory}]`);

    if (dataCategory !== 'real' || this.consumerKey === 'stub_key') {
      return {
        ConversationID: `stub-conv-${Date.now()}`,
        OriginatorConversationID: `stub-orig-${Date.now()}`,
        ResponseCode: '0',
        ResponseDescription: 'Accept the service request successfully.'
      };
    }

    const token = await this.getAccessToken();
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const body = {
      InitiatorName: this.initiatorName,
      SecurityCredential: this.initiatorPassword, // In real app, this should be encrypted with public key
      CommandID: 'BusinessPayment',
      Amount: Math.round(amount),
      PartyA: this.b2cShortcode,
      PartyB: formattedPhone,
      Remarks: remarks || 'Driver Payout',
      QueueTimeOutURL: callbackUrl, // Typically same as ResultURL or separate
      ResultURL: callbackUrl,
      Occasion: 'Payout'
    };

    try {
      const response = await fetch(`${this.baseUrl}/mpesa/b2c/v1/paymentrequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      return await response.json();
    } catch (error) {
      console.error('[Daraja] B2C Payout error:', error);
      throw error;
    }
  }

  async checkBalance({ dataCategory = 'real' }) {
      console.log(`[Daraja] Account Balance request [Category: ${dataCategory}]`);

      if (dataCategory !== 'real' || this.consumerKey === 'stub_key') {
          return {
              ConversationID: `stub-bal-${Date.now()}`,
              OriginatorConversationID: `stub-orig-bal-${Date.now()}`,
              ResponseCode: '0',
              ResponseDescription: 'Accept the service request successfully.'
          };
      }

      const token = await this.getAccessToken();

      const body = {
          Initiator: this.initiatorName,
          SecurityCredential: this.initiatorPassword,
          CommandID: 'AccountBalance',
          PartyA: this.shortcode,
          IdentifierType: '4', // Shortcode
          Remarks: 'Balance check',
          QueueTimeOutURL: 'https://stub.com/queue',
          ResultURL: 'https://stub.com/result'
      };

      try {
          const response = await fetch(`${this.baseUrl}/mpesa/accountbalance/v1/query`, {
              method: 'POST',
              headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(body)
          });
          
          return await response.json();
      } catch (error) {
          console.error('[Daraja] Account Balance error:', error);
          throw error;
      }
  }

  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned;
    }
    return cleaned;
  }
}

export const daraja = new DarajaClient();
