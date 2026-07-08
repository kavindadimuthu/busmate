// This script updates app_metadata for all existing auth.users in Supabase
// to set user_type and account_status from the local users table.
// Run: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx apps/backend/user-management/scripts/migrate-supabase-metadata.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface UserRow {
  user_id: string;
  account_status: string;
  user_types: { name: string } | { name: string }[];
}

function resolveUserType(row: UserRow): string | null {
  const types = row.user_types;
  if (Array.isArray(types)) {
    return types[0]?.name ?? null;
  }
  return types?.name ?? null;
}

async function migrate() {
  const { data: users, error } = await supabase
    .from('users')
    .select('user_id, account_status, user_types!inner(name)');

  if (error) {
    console.error('Failed to fetch users from local DB:', error.message);
    process.exit(1);
  }

  const rows = (users ?? []) as unknown as UserRow[];
  console.log(`Fetched ${rows.length} users to migrate.`);

  let succeeded = 0;
  let failed = 0;
  const failures: { userId: string; reason: string }[] = [];

  for (const user of rows) {
    const userType = resolveUserType(user);
    if (!userType) {
      failed++;
      failures.push({ userId: user.user_id, reason: 'missing user_type after join' });
      console.error(`Skipped ${user.user_id}: missing user_type`);
      continue;
    }

    try {
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.user_id, {
        app_metadata: {
          user_type: userType,
          account_status: user.account_status,
        },
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      succeeded++;
      console.log(`Updated ${user.user_id} (${userType}, ${user.account_status})`);
    } catch (err) {
      failed++;
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ userId: user.user_id, reason });
      console.error(`Failed ${user.user_id}: ${reason}`);
    }
  }

  console.log('\n--- Migration summary ---');
  console.log(`Total:     ${rows.length}`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed:    ${failed}`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  ${f.userId}: ${f.reason}`);
    }
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

migrate();
