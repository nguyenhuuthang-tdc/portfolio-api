import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Index,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './auth.model';

@Table({ tableName: 'auth_sessions', timestamps: true })
export class AuthSession extends Model {
  @Column({ type: DataType.UUID, primaryKey: true })
  id!: string;

  @ForeignKey(() => User)
  @Index('idx_auth_sessions_user_id')
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId!: number;

  @BelongsTo(() => User)
  user?: User;

  @Index('idx_auth_sessions_family_id')
  @Column({ type: DataType.UUID, allowNull: false })
  familyId!: string;

  @Index({ name: 'uq_auth_sessions_token_hash', unique: true })
  @Column({ type: DataType.STRING(64), allowNull: false })
  tokenHash!: string;

  @Column({ type: DataType.UUID, allowNull: true })
  replacedById!: string | null;

  @Index('idx_auth_sessions_expires_at')
  @Column({ type: DataType.DATE, allowNull: false })
  expiresAt!: Date;

  @Index('idx_auth_sessions_revoked_at')
  @Column({ type: DataType.DATE, allowNull: true })
  revokedAt!: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  lastUsedAt!: Date | null;

  @Column({ type: DataType.STRING(64), allowNull: true })
  ipHash!: string | null;

  @Column({ type: DataType.STRING(64), allowNull: true })
  userAgentHash!: string | null;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
