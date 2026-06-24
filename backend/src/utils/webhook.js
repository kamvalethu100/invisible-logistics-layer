
import axios from 'axios';

export const webhookService = {
  /**
   * Call a webhook for a specific event.
   */
  async callWebhook(url, event, data) {
    if (!url) return;

    try {
      console.log(`[Webhook] Calling ${url} for event ${event}...`);
      // In a real app, you'd want to sign the request
      await axios.post(url, {
        event,
        timestamp: new Date().toISOString(),
        data
      }, { timeout: 5000 });
      console.log(`[Webhook] Successfully called ${url} for event ${event}`);
    } catch (error) {
      console.error(`[Webhook] Failed to call ${url} for event ${event}: ${error.message}`);
      // In a production system, we'd queue this for retry
    }
  }
};
