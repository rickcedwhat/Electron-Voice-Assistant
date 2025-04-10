import { execSync } from 'child_process';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import * as path from 'path';

dayjs.extend(utc);

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Usage: node scripts/generateMigration.js <migration_name>');
  process.exit(1);
}

const nowUTC = dayjs.utc();
const timestamp = nowUTC.format('YYYYMMDDHHmmss');
const outputDir = path.join(process.cwd(), 'supabase', 'migrations');
const outputFile = path.join(outputDir, `${timestamp}_${migrationName}.sql`);

console.log(`Generating migration file: ${outputFile}`);

try {
  const command = `npx supabase db diff --file "${outputFile}"`;
  execSync(command, { stdio: 'inherit' });
  console.log('Migration file generated successfully.');
} catch (error) {
  console.error('Error generating migration file:', error);
  process.exit(1);
}
