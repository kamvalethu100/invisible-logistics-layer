
class KenyaVerificationService {
  /**
   * Validates the format of a Kenyan KRA PIN.
   * Format: 11 characters, starts with a letter, ends with a letter, 9 digits in between.
   */
  validateKraPin(pin) {
    if (!pin) return false;
    const kraPinRegex = /^[A-Z][0-9]{9}[A-Z]$/i;
    return kraPinRegex.test(pin);
  }

  /**
   * Simulates verification against Kenyan government and private databases.
   * In a production environment, these would call real APIs.
   */
  async verifyDriver(metadata) {
    const results = {
      iprs: { status: 'passed', message: 'ID number matches records' },
      ntsa: { status: 'passed', message: 'Driving license and vehicle commercial registration valid' },
      dci: { status: 'passed', message: 'Certificate of Good Conduct verified' },
      sacco: { status: 'passed', message: 'Member of Boda Boda Sacco confirmed' },
      kra: { status: 'passed', message: 'KRA PIN format valid' },
      overall: 'passed'
    };

    // Simulate random failure for testability if desired, 
    // or just pass everything for the demo.
    console.log('[KenyaVerify] Simulating external checks for driver:', metadata.id_number);
    
    // Add logic to fail if certain conditions met in metadata (e.g. invalid ID format)
    if (metadata.id_number && (metadata.id_number.length < 7 || metadata.id_number.length > 8)) {
        results.iprs = { status: 'failed', message: 'Invalid ID number format (Expected 7-8 digits)' };
        results.overall = 'failed';
    }

    if (!this.validateKraPin(metadata.kra_pin)) {
        results.kra = { status: 'failed', message: 'Invalid KRA PIN format' };
        results.overall = 'failed';
    }

    return results;
  }

  async verifyBusiness(metadata) {
    const results = {
      cipc: { status: 'passed', message: 'Business registration active' },
      itax: { status: 'passed', message: 'KRA PIN verified' },
      county: { status: 'passed', message: 'Single Business Permit valid' },
      overall: 'passed'
    };

    console.log('[KenyaVerify] Simulating external checks for business:', metadata.cr12_registration_number);
    
    if (!this.validateKraPin(metadata.kra_pin_business)) {
        results.itax = { status: 'failed', message: 'Invalid Business KRA PIN format' };
        results.overall = 'failed';
    }

    return results;
  }
}

export const kenyaVerify = new KenyaVerificationService();
