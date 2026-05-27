import { z } from 'zod';
import { kenyaVerify } from '../utils/kenyaVerification.js';

const kycSchemaZA = z.object({
  id_number: z.string(),
  license_number: z.string(),
  vehicle_registration: z.string(),
  proof_of_residence_url: z.string().url(),
  bank_account_header_url: z.string().url().optional()
});

const kybSchemaZA = z.object({
  cipc_registration_number: z.string(),
  director_id_number: z.string(),
  proof_of_business_address_url: z.string().url(),
  vat_certificate_url: z.string().url().optional()
});

const kycSchemaKE = z.object({
  id_number: z.string().min(7).max(8),
  license_number: z.string(),
  vehicle_registration: z.string(),
  kra_pin: z.string().regex(/^[A-Z][0-9]{9}[A-Z]$/i, "Invalid KRA PIN format"),
  sacco_membership_proof_url: z.string().url(),
  good_conduct_cert_url: z.string().url(),
  psv_insurance_url: z.string().url()
});

const kybSchemaKE = z.object({
  cr12_registration_number: z.string(),
  kra_pin_business: z.string().regex(/^[A-Z][0-9]{9}[A-Z]$/i, "Invalid KRA PIN format"),
  single_business_permit_url: z.string().url(),
  director_id_number: z.string().min(7).max(8)
});

export async function verificationRoutes(fastify, options) {
  const db = fastify.db;

  fastify.addHook('preHandler', fastify.authenticate);

  // Submit verification request
  fastify.post('/submit', async (request, reply) => {
    try {
      const user = await db.get('SELECT role, country_code FROM users WHERE id = ?', [request.user.id]);
      let data;
      let autoVerificationResults = null;
      
      if (user.country_code === 'KE') {
        if (user.role === 'driver') {
          data = kycSchemaKE.parse(request.body);
          autoVerificationResults = await kenyaVerify.verifyDriver(data);
        } else if (user.role === 'business') {
          data = kybSchemaKE.parse(request.body);
          autoVerificationResults = await kenyaVerify.verifyBusiness(data);
        }
      } else {
        // Default to ZA or other regions
        if (user.role === 'driver') {
          data = kycSchemaZA.parse(request.body);
        } else if (user.role === 'business') {
          data = kybSchemaZA.parse(request.body);
        }
      }

      if (!data) {
        return reply.status(400).send({ error: 'Invalid user role or country for verification' });
      }

      const metadata = {
          ...data,
          auto_verification: autoVerificationResults
      };

      await db.run(
        'UPDATE users SET verification_status = "PENDING", verification_metadata = ? WHERE id = ?',
        [JSON.stringify(metadata), request.user.id]
      );

      // If auto-verification passed, we could optionally auto-verify the user here
      // but per requirements, it's usually a pending review status first.
      
      return { 
          status: 'submitted', 
          message: 'Verification request is pending review', 
          role: user.role,
          auto_verification: autoVerificationResults 
      };
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Get verification status
  fastify.get('/status', async (request, reply) => {
    const user = await db.get('SELECT verification_status, verification_metadata FROM users WHERE id = ?', [request.user.id]);
    return {
        status: user.verification_status,
        metadata: JSON.parse(user.verification_metadata || '{}')
    };
  });

  // Admin: Verify user
  fastify.post('/verify/:userId', async (request, reply) => {
    // Basic role check
    const admin = await db.get('SELECT role FROM users WHERE id = ?', [request.user.id]);
    if (admin.role !== 'admin') {
        return reply.status(403).send({ error: 'Only admins can verify users' });
    }
    
    const { userId } = request.params;
    const { status } = request.body;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
        return reply.status(400).send({ error: 'Invalid status' });
    }

    await db.run(
      'UPDATE users SET verification_status = ? WHERE id = ?',
      [status, userId]
    );

    return { status: 'success', userId, new_status: status };
  });
}
