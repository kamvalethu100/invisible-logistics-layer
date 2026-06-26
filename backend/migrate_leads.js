import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';

const dbPath = './database.sqlite';
const logPath = '/home/team/shared/pilot_outreach_log.md';

async function migrate() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  const content = fs.readFileSync(logPath, 'utf8');
  console.log('Content length:', content.length);

  const lines = content.split('\n');
  console.log('Total lines:', lines.length);

  for (const line of lines) {
    if (line.includes('| SME-')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p !== '');
      if (parts.length < 7) continue;
      const [id, name, location, contact_method, outreach_date, status, notes] = parts;
      
      const metadata = JSON.stringify({
        location,
        contact_method,
        outreach_date
      });

      console.log('Migrating SME:', id);
      await db.run(
        `INSERT OR REPLACE INTO leads (id, name, type, status, data_category, notes, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, 'sme', status, 'real', notes, metadata]
      );
    } else if (line.includes('| DRV-')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p !== '');
      if (parts.length < 7) continue;
      const [id, name, vehicle, zone, outreach_date, status, notes] = parts;
      
      const metadata = JSON.stringify({
        vehicle,
        location: zone,
        outreach_date
      });

      console.log('Migrating Driver:', id);
      await db.run(
        `INSERT OR REPLACE INTO leads (id, name, type, status, data_category, notes, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, 'driver', status, 'real', notes, metadata]
      );
    }
  }

  console.log('Migration completed successfully.');
  await db.close();
}

migrate().catch(console.error);
