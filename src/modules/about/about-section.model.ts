import {
  Table,
  Column,
  Model,
  DataType,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'about_sections', timestamps: true, createdAt: false, updatedAt: true })
export class AboutSection extends Model {
  @Unique
  @Column({ type: DataType.STRING(100), allowNull: false })
  key!: string;

  @Column({ type: DataType.TEXT('long'), allowNull: false })
  content!: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  label!: string | null;

  @UpdatedAt
  updatedAt!: Date;
}
