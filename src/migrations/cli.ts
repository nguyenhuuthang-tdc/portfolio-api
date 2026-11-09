import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/database';
import { logger } from '../config/logger';
import { rollbackLastMigration, runMigrations } from './runner';

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'up';
  await sequelize.authenticate();

  if (command === 'up') {
    await runMigrations();
  } else if (command === 'down') {
    await rollbackLastMigration();
  } else {
    throw new Error(`Unknown migration command: ${command}`);
  }
}

main()
  .catch((error) => {
    logger.error({
      event: 'migration_command_failed',
      err: error,
    }, 'Migration command failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
