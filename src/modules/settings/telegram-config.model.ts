import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'telegram_configs', timestamps: true })
export class TelegramConfig extends Model {
  @Column({ type: DataType.STRING(255), allowNull: false, defaultValue: '' })
  botToken!: string;

  @Column({ type: DataType.STRING(64), allowNull: false, defaultValue: '' })
  chatId!: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  enabled!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
