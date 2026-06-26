
class KenyaVerificationService {
  /**
   * Validates Kenyan KRA PIN format.
   * Format: 11 characters. 1st is A (Individual), P (Company), or M (Government). 
   * Followed by 9 digits and ending with a letter.
   */
  validateKraPin(pin) {
    if (!pin) return false;
    const regex = /^[APM]\d{9}[A-Z]$/i;
    return regex.test(pin);
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
      overall: 'passed'
    };

    // Simulate random failure for testability if desired, 
    // or just pass everything for the demo.
    console.log('[KenyaVerify] Simulating external checks for driver:', metadata.id_number);
    
    // Add logic to fail if certain conditions met in metadata (e.g. invalid ID format)
    if (metadata.id_number && metadata.id_number.length < 7) {
        results.iprs = { status: 'failed', message: 'Invalid ID number format' };
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
    
    return results;
  }
}

export const kenyaVerify = new KenyaVerificationService();
