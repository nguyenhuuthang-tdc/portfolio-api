import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Blog } from './blog.model';

@Table({ tableName: 'view_logs', timestamps: true })
export class ViewLog extends Model {
  @ForeignKey(() => Blog)
  @Column({ type: DataType.INTEGER, allowNull: false })
  blogId!: number;

  @Column({ type: DataType.STRING(64), allowNull: false })
  ipHash!: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  processed!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @BelongsTo(() => Blog)
  blog!: Blog;
}
