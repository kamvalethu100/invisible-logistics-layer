import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const leadCreateSchema = z.object({
  name: z.string(),
  type: z.enum(['sme', 'driver']),
  status: z.enum(['CONTACTED', 'INTERESTED', 'QUALIFIED', 'SIGNED', 'PENDING']).default('PENDING'),
  data_category: z.enum(['real', 'test', 'simulated']).optional(),
  country_code: z.string().length(2).optional(),
  currency_code: z.string().length(3).optional(),
  region: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const leadUpdateSchema = z.object({
  status: z.enum(['CONTACTED', 'INTERESTED', 'QUALIFIED', 'SIGNED', 'PENDING']).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export async function leadRoutes(fastify, options) {
  const db = fastify.db;

  fastify.addHook('preHandler', fastify.authenticate);

  // Create lead
  fastify.post('/', async (request, reply) => {
    try {
      const data = leadCreateSchema.parse(request.body);
      const user = await db.get('SELECT data_category, country_code, currency_code, region FROM users WHERE id = ?', [request.user.id]);
      
      const id = uuidv4();
      const category = data.data_category || user.data_category;
      const country = data.country_code || user.country_code;
      const currency = data.currency_code || user.currency_code;
      const region = data.region || user.region;

      await db.run(
        `INSERT INTO leads (id, name, type, status, data_category, country_code, currency_code, region, notes, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id, data.name, data.type, data.status, category, country, currency, region,
            data.notes || null, data.metadata ? JSON.stringify(data.metadata) : null
        ]
      );

      return await db.get('SELECT * FROM leads WHERE id = ?', [id]);
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // List leads
  fastify.get('/', async (request, reply) => {
    const { category, type, country, region } = request.query;
    
    const user = await db.get('SELECT data_category, country_code, region, role FROM users WHERE id = ?', [request.user.id]);
    const filterCategory = category || user.data_category;
    const filterCountry = country || user.country_code;
    const filterRegion = region || user.region;

    let query = 'SELECT * FROM leads WHERE data_category = ? AND country_code = ? AND region = ?';
    let params = [filterCategory, filterCountry, filterRegion];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    const leads = await db.all(query + ' ORDER BY created_at DESC', params);
    return leads;
  });

  // Get lead stats
  fastify.get('/stats', async (request, reply) => {
    const { category, country, region } = request.query;
    const user = await db.get('SELECT data_category, country_code, region FROM users WHERE id = ?', [request.user.id]);
    const filterCategory = category || user.data_category;
    const filterCountry = country || user.country_code;
    const filterRegion = region || user.region;

    const stats = await db.all(`
      SELECT type, status, COUNT(*) as count 
      FROM leads 
      WHERE data_category = ? AND country_code = ? AND region = ?
      GROUP BY type, status`, 
      [filterCategory, filterCountry, filterRegion]
    );

    return { stats, data_category: filterCategory, country_code: filterCountry, region: filterRegion };
  });

  // Update lead
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params;
    
    try {
      const data = leadUpdateSchema.parse(request.body);
      
      const lead = await db.get('SELECT * FROM leads WHERE id = ?', [id]);
      if (!lead) {
        return reply.status(404).send({ error: 'Lead not found' });
      }

      const updates = [];
      const params = [];

      if (data.status) {
        updates.push('status = ?');
        params.push(data.status);
      }
      if (data.notes !== undefined) {
        updates.push('notes = ?');
        params.push(data.notes);
      }
      if (data.metadata) {
        const mergedMetadata = { ...JSON.parse(lead.metadata || '{}'), ...data.metadata };
        updates.push('metadata = ?');
        params.push(JSON.stringify(mergedMetadata));
      }

      if (updates.length === 0) {
        return lead;
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      await db.run(
        `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      const updatedLead = await db.get('SELECT * FROM leads WHERE id = ?', [id]);
      return updatedLead;

    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  });
}
