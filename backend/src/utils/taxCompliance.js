
export class TaxComplianceService {
  /**
   * Calculates the withholding tax for a given payout amount in Kenya.
   * Standard WHT for management/professional/contractual fees for residents is 5%.
   * In a real scenario, this might depend on thresholds or specific categories.
   */
  calculateKenyanWHT(amount, isResident = true) {
    if (amount <= 0) return 0;
    
    // For MVP, we apply a flat 5% withholding tax for professional services/contractors
    const rate = isResident ? 0.05 : 0.20;
    return amount * rate;
  }

  /**
   * Validates if a user is tax compliant based on their metadata.
   * For Kenya, this means having a valid KRA PIN.
   */
  async checkCompliance(user, db) {
    if (user.country_code !== 'KE') return { compliant: true };

    const metadata = JSON.parse(user.verification_metadata || '{}');
    const kraPin = metadata.kra_pin || metadata.kra_pin_business;

    if (!kraPin) {
      return { compliant: false, reason: 'KRA PIN missing' };
    }

    // Basic format check (regex already used in kenyaVerification, but good to have here too)
    const kraPinRegex = /^[A-Z][0-9]{9}[A-Z]$/i;
    if (!kraPinRegex.test(kraPin)) {
      return { compliant: false, reason: 'Invalid KRA PIN format' };
    }

    return { compliant: true, kra_pin: kraPin };
  }
}

export const taxCompliance = new TaxComplianceService();
