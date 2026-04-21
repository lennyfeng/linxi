import bcrypt from 'bcryptjs';
import { lingxingRequest } from './client.js';
import { query } from '../../database/index.js';

const DEFAULT_PASSWORD = 'linxi123';

interface LingxingUser {
  uid: string;
  realname: string;
  username: string;
  mobile: string;
  email: string;
  status: number;
  role: string;
  is_master: number;
}

export async function syncLingxingUsers(): Promise<{ synced: number; created: number; updated: number }> {
  const users = await lingxingRequest<LingxingUser[]>(
    '/erp/sc/data/account/lists',
    {},
    'GET',
  );

  if (!Array.isArray(users)) {
    throw new Error('Unexpected response from Lingxing user list');
  }

  let created = 0;
  let updated = 0;

  for (const lxUser of users) {
    const existing = await query<{ id: number }>(
      'SELECT id FROM users WHERE lingxing_uid = ? LIMIT 1',
      [lxUser.uid],
    );

    const status = lxUser.status === 1 ? 'active' : 'disabled';

    if (existing[0]) {
      await query(
        `UPDATE users SET
          display_name = ?,
          email = COALESCE(NULLIF(?, ''), email),
          phone = COALESCE(NULLIF(?, ''), phone),
          status = ?
        WHERE id = ?`,
        [lxUser.realname || lxUser.username, lxUser.email, lxUser.mobile, status, existing[0].id],
      );
      updated++;
    } else {
      const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      await query(
        `INSERT INTO users (username, display_name, email, phone, lingxing_uid, status, password_hash, must_change_password)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          lxUser.username || `lx_${lxUser.uid}`,
          lxUser.realname || lxUser.username,
          lxUser.email || null,
          lxUser.mobile || null,
          lxUser.uid,
          status,
          passwordHash,
        ],
      );
      created++;
    }
  }

  return { synced: users.length, created, updated };
}
