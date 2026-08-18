import {
  Table,
  Column,
  Model,
  DataType,
  Unique,
  CreatedAt,
  UpdatedAt,
  Default,
} from 'sequelize-typescript';

@Table({ tableName: 'projects', timestamps: true })
export class Project extends Model {
  @Column({ type: DataType.STRING(255), allowNull: false })
  title!: string;

  @Unique
  @Column({ type: DataType.STRING(280), allowNull: false })
  slug!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string | null;

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  detailContent!: string | null;

  @Column({ type: DataType.JSON, allowNull: true })
  techStack!: string[] | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  githubUrl!: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  demoUrl!: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  thumbnail!: string | null;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  hasDetail!: boolean;

  @Default(0)
  @Column({ type: DataType.INTEGER })
  order!: number;

  @Column({
    type: DataType.ENUM('active', 'archived', 'in_progress'),
    defaultValue: 'active',
  })
  status!: 'active' | 'archived' | 'in_progress';

  @Column({ type: DataType.DATE, allowNull: true })
  completedAt!: Date | null;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
