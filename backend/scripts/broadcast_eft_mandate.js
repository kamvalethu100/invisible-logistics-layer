import { initDb } from '../src/db.js';
import { v4 as uuidv4 } from 'uuid';

async function broadcast() {
  const db = await initDb();
  const message = "STRATEGIC UPDATE: FlowGrid has moved to a strict EFT-only payment settlement model. This ensures 100% security for all jobs. All loads now require manual verification of Proof of Payment (POP) before driver matching begins. Please see the updated payment instructions in your dashboard.";
  const type = "system_announcement";

  const users = await db.all('SELECT id FROM users');
  console.log(`Broadcasting to ${users.length} users...`);

  let count = 0;
  for (const user of users) {
    const id = uuidv4();
    try {
      await db.run(
        'INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)',
        [id, user.id, type, message]
      );
      count++;
    } catch (e) {
      console.error(`Failed to notify user ${user.id}: ${e.message}`);
    }
  }

  // Reset acknowledgement for all users
  await db.run('UPDATE users SET system_notice_acknowledged = 0');

  console.log(`Successfully broadcast to ${count} users.`);
  process.exit(0);
}

broadcast().catch(err => {
  console.error(err);
  process.exit(1);
});
