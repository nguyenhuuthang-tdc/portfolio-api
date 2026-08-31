import { DataTypes, QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { createAuthSessionsMigration } from './202608290001-create-auth-sessions';
import { Migration } from './migration.types';

const MIGRATION_LOCK = 'portfolio_api_schema_migrations';
const migrations: Migration[] = [createAuthSessionsMigration];

async function ensureMetadataTable(): Promise<void> {
  const tables = await sequelize.getQueryInterface().showAllTables();
  if (tables.map(String).includes('schema_migrations')) return;

  await sequelize.getQueryInterface().createTable('schema_migrations', {
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
    },
    executed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });
}

async function withMigrationLock<T>(operation: () => Promise<T>): Promise<T> {
  const [row] = await sequelize.query<{ acquired: number }>(
    'SELECT GET_LOCK(:lockName, 30) AS acquired',
    { replacements: { lockName: MIGRATION_LOCK }, type: QueryTypes.SELECT }
  );
  if (!row || Number(row.acquired) !== 1) {
    throw new Error('Could not acquire database migration lock');
  }

  try {
    return await operation();
  } finally {
    await sequelize.query('SELECT RELEASE_LOCK(:lockName)', {
      replacements: { lockName: MIGRATION_LOCK },
    });
  }
}

export async function runMigrations(): Promise<void> {
  await withMigrationLock(async () => {
    await ensureMetadataTable();
    const executed = await sequelize.query<{ name: string }>(
      'SELECT name FROM schema_migrations',
      { type: QueryTypes.SELECT }
    );
    const executedNames = new Set(executed.map((item) => item.name));

    for (const migration of migrations) {
      if (executedNames.has(migration.name)) continue;
      await sequelize.transaction(async (transaction) => {
        await migration.up(sequelize.getQueryInterface(), transaction);
        await sequelize.getQueryInterface().bulkInsert(
          'schema_migrations',
          [{ name: migration.name, executed_at: new Date() }],
          { transaction }
        );
      });
      console.log(`Migration applied: ${migration.name}`);
    }
  });
}

export async function rollbackLastMigration(): Promise<void> {
  await withMigrationLock(async () => {
    await ensureMetadataTable();
    const [latest] = await sequelize.query<{ name: string }>(
      'SELECT name FROM schema_migrations ORDER BY executed_at DESC LIMIT 1',
      { type: QueryTypes.SELECT }
    );
    if (!latest) return;

    const migration = migrations.find((item) => item.name === latest.name);
    if (!migration) {
      throw new Error(`Migration implementation not found: ${latest.name}`);
    }

    await sequelize.transaction(async (transaction) => {
      await migration.down(sequelize.getQueryInterface(), transaction);
      await sequelize.getQueryInterface().bulkDelete(
        'schema_migrations',
        { name: migration.name },
        { transaction }
      );
    });
    console.log(`Migration rolled back: ${migration.name}`);
  });
}
