import {
  Table,
  Column,
  Model,
  DataType,
  Unique,
  CreatedAt,
  UpdatedAt,
  BelongsToMany,
} from 'sequelize-typescript';
import { Blog } from './blog.model';
import { BlogCategoryMap } from './blog-category-map.model';

@Table({ tableName: 'blog_categories', timestamps: true })
export class BlogCategory extends Model {
  @Column({ type: DataType.STRING(100), allowNull: false })
  name!: string;

  @Unique
  @Column({ type: DataType.STRING(120), allowNull: false })
  slug!: string;

  @Column({ type: DataType.STRING(20), defaultValue: '#6366f1' })
  color!: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  description!: string | null;

  @BelongsToMany(() => Blog, () => BlogCategoryMap)
  blogs!: Blog[];

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
