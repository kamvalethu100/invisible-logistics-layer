const BASE_URL = 'http://localhost:3002/api';

async function testLeads() {
  try {
    console.log('--- Leads Verification Started ---');

    // 1. Register a user
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `admin_shared_${Date.now()}@test.com`,
        password: 'password123',
        name: 'Admin User Shared',
        role: 'business',
        data_category: 'real'
      })
    });
    const { token } = await res.json();

    // 2. Fetch leads
    const leadsRes = await fetch(`${BASE_URL}/leads`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const leads = await leadsRes.json();
    console.log('Fetched leads count:', leads.length);
    if (leads.length > 0) {
      const lead = leads[0];
      console.log('Sample Lead:', lead.id, lead.name, lead.status, lead.type);
      console.log('Metadata:', lead.metadata);
      
      // 3. Patch a lead
      console.log('Patching lead...');
      const patchRes = await fetch(`${BASE_URL}/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          status: 'QUALIFIED',
          notes: 'Discovery call completed - updated via API'
        })
      });
      const patchedLead = await patchRes.json();
      console.log('Patched Lead Status:', patchedLead.status);
      console.log('Patched Lead Notes:', patchedLead.notes);
      console.log('Patched Lead Updated At:', patchedLead.updated_at);
    }

    // 4. Fetch leads stats
    const statsRes = await fetch(`${BASE_URL}/leads/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const stats = await statsRes.json();
    console.log('Leads Stats:', JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('Leads test failed:', error.message);
  }
}

testLeads();
