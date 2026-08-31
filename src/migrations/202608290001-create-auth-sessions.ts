import { DataTypes } from 'sequelize';
import { Migration } from './migration.types';

export const createAuthSessionsMigration: Migration = {
  name: '202608290001-create-auth-sessions',

  async up(queryInterface, transaction) {
    const tables = await queryInterface.showAllTables({ transaction });
    if (!tables.map(String).includes('auth_sessions')) {
      await queryInterface.createTable(
        'auth_sessions',
        {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        family_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        token_hash: {
          type: DataTypes.STRING(64),
          allowNull: false,
          unique: true,
        },
        replaced_by_id: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        revoked_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        last_used_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        ip_hash: {
          type: DataTypes.STRING(64),
          allowNull: true,
        },
        user_agent_hash: {
          type: DataTypes.STRING(64),
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        },
        { transaction }
      );
    }

    const indexes = (await queryInterface.showIndex('auth_sessions', { transaction })) as unknown as Array<{
      name: string;
    }>;
    const indexNames = new Set(indexes.map((index) => index.name));

    if (!indexNames.has('idx_auth_sessions_user_id')) {
      await queryInterface.addIndex('auth_sessions', ['user_id'], {
        name: 'idx_auth_sessions_user_id',
        transaction,
      });
    }
    if (!indexNames.has('idx_auth_sessions_family_id')) {
      await queryInterface.addIndex('auth_sessions', ['family_id'], {
        name: 'idx_auth_sessions_family_id',
        transaction,
      });
    }
    if (!indexNames.has('idx_auth_sessions_expires_at')) {
      await queryInterface.addIndex('auth_sessions', ['expires_at'], {
        name: 'idx_auth_sessions_expires_at',
        transaction,
      });
    }
    if (!indexNames.has('idx_auth_sessions_revoked_at')) {
      await queryInterface.addIndex('auth_sessions', ['revoked_at'], {
        name: 'idx_auth_sessions_revoked_at',
        transaction,
      });
    }
  },

  async down(queryInterface, transaction) {
    await queryInterface.dropTable('auth_sessions', { transaction });
  },
};
