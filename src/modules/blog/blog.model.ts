import {
  Table,
  Column,
  Model,
  DataType,
  Unique,
  CreatedAt,
  UpdatedAt,
  BelongsToMany,
  HasMany,
  Default,
} from 'sequelize-typescript';
import { BlogCategory } from './blog-category.model';
import { BlogCategoryMap } from './blog-category-map.model';
import { ViewLog } from './view-log.model';

@Table({ tableName: 'blogs', timestamps: true })
export class Blog extends Model {
  @Column({ type: DataType.STRING(255), allowNull: false })
  title!: string;

  @Unique
  @Column({ type: DataType.STRING(280), allowNull: false })
  slug!: string;

  @Column({ type: DataType.TEXT('long'), allowNull: false })
  content!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  excerpt!: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  thumbnail!: string | null;

  @Column({
    type: DataType.ENUM('draft', 'published'),
    defaultValue: 'draft',
    allowNull: false,
  })
  status!: 'draft' | 'published';

  @Default(0)
  @Column({ type: DataType.INTEGER.UNSIGNED })
  viewCount!: number;

  @Column({ type: DataType.DATE, allowNull: true })
  publishedAt!: Date | null;

  @BelongsToMany(() => BlogCategory, () => BlogCategoryMap)
  categories!: BlogCategory[];

  @HasMany(() => ViewLog)
  viewLogs!: ViewLog[];

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
