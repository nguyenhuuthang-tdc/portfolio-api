import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  Default,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'contacts', timestamps: true })
export class Contact extends Model {
  @Column({ type: DataType.STRING(150), allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  email!: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  subject!: string | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  message!: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  isRead!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
