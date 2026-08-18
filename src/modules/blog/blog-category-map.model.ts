import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { Blog } from './blog.model';
import { BlogCategory } from './blog-category.model';

@Table({ tableName: 'blog_category_map', timestamps: false })
export class BlogCategoryMap extends Model {
  @ForeignKey(() => Blog)
  @Column({ type: DataType.INTEGER, allowNull: false })
  blogId!: number;

  @ForeignKey(() => BlogCategory)
  @Column({ type: DataType.INTEGER, allowNull: false })
  categoryId!: number;
}
