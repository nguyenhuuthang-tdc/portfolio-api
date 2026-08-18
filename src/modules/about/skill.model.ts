import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'skills', timestamps: true })
export class Skill extends Model {
  @Column({ type: DataType.STRING(100), allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  category!: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  level!: number | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  icon!: string | null;

  @Default(0)
  @Column({ type: DataType.INTEGER })
  order!: number;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  isVisible!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
