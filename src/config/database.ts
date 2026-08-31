import { Sequelize } from 'sequelize-typescript';
import { User } from '../modules/auth/auth.model';
import { AuthSession } from '../modules/auth/auth-session.model';
import { Blog } from '../modules/blog/blog.model';
import { BlogCategory } from '../modules/blog/blog-category.model';
import { BlogCategoryMap } from '../modules/blog/blog-category-map.model';
import { ViewLog } from '../modules/blog/view-log.model';
import { Project } from '../modules/project/project.model';
import { Contact } from '../modules/contact/contact.model';
import { AboutSection } from '../modules/about/about-section.model';
import { Skill } from '../modules/about/skill.model';
import { TelegramConfig } from '../modules/settings/telegram-config.model';

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_DATABASE || 'portfolio_local',
  username: process.env.DB_USERNAME || 'sqladmin',
  password: process.env.DB_PASSWORD,
  models: [
    User,
    AuthSession,
    Blog,
    BlogCategory,
    BlogCategoryMap,
    ViewLog,
    Project,
    Contact,
    AboutSection,
    Skill,
    TelegramConfig,
  ],
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
