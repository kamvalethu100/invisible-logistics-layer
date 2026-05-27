import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

class PaystackClient {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || 'stub_key';
    this.baseUrl = 'https://api.paystack.co';
  }

  async initializeTransaction({ email, amount, callbackUrl, dataCategory = 'real' }) {
    console.log(`[Paystack] Initialize transaction for ${email} - ${amount} ZAR [Category: ${dataCategory}]`);

    if (dataCategory !== 'real' || this.secretKey === 'stub_key') {
      return {
        status: true,
        message: 'Authorization URL created',
        data: {
          authorization_url: 'https://checkout.paystack.com/stub-url',
          access_code: 'stub-code',
          reference: `stub-ref-${Date.now()}`
        }
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100), // Paystack expects amount in cents
          callback_url: callbackUrl,
          metadata: {
            data_category: dataCategory
          }
        })
      });

      return await response.json();
    } catch (error) {
      console.error('[Paystack] Initialize error:', error);
      throw error;
    }
  }

  async verifyTransaction(reference) {
    if (this.secretKey === 'stub_key') {
        return { status: true, data: { status: 'success', reference } };
    }

    try {
      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('[Paystack] Verify error:', error);
      throw error;
    }
  }

  verifyWebhookSignature(signature, payload) {
    if (this.secretKey === 'stub_key') return true;
    
    const hash = crypto.createHmac('sha512', this.secretKey).update(JSON.stringify(payload)).digest('hex');
    return hash === signature;
  }
}

export const paystack = new PaystackClient();
