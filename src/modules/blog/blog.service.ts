import { Op } from 'sequelize';
import { Blog } from './blog.model';
import { BlogCategory } from './blog-category.model';
import { ViewLog } from './view-log.model';
import { AppError } from '../../middleware/error.middleware';
import { uploadService } from '../upload/upload.service';
import {
  CreateBlogDto,
  UpdateBlogDto,
  BlogQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './blog.types';

import { slugify } from '../../utils/slug';
import { stripMediaOrigins, toStoredMediaPath } from '../../utils/media-path';

export const blogService = {
  async findAll(query: BlogQueryDto) {
    const { page, limit, status, category, search } = query;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status !== 'all') where.status = status;
    if (search) where.title = { [Op.like]: `%${search}%` };

    const include: object[] = [
      {
        model: BlogCategory,
        as: 'categories',
        through: { attributes: [] },
        ...(category ? { where: { slug: category } } : {}),
        required: !!category,
      },
    ];

    const { count, rows } = await Blog.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [['publishedAt', 'DESC'], ['createdAt', 'DESC']],
      distinct: true,
    });

    return { rows, total: count, page, limit };
  },

  async findBySlug(slug: string, publishedOnly = false): Promise<Blog> {
    const needle = slugify(decodeURIComponent(slug));
    const include = [{ model: BlogCategory, as: 'categories', through: { attributes: [] } }];
    const statusWhere = publishedOnly ? { status: 'published' as const } : {};
    const exact = await Blog.findOne({ where: { slug: needle, ...statusWhere }, include });
    if (exact) return exact;

    const rows = await Blog.findAll({ where: statusWhere, include });
    const blog = rows.find((row) => slugify(row.slug) === needle);
    if (!blog) throw new AppError('Blog not found', 404);
    return blog;
  },

  async findById(id: number, publishedOnly = false): Promise<Blog> {
    const blog = await Blog.findByPk(id, {
      include: [{ model: BlogCategory, as: 'categories', through: { attributes: [] } }],
    });
    if (!blog || (publishedOnly && blog.status !== 'published')) {
      throw new AppError('Blog not found', 404);
    }
    return blog;
  },

  async create(dto: CreateBlogDto): Promise<Blog> {
    const slug = slugify(dto.slug || dto.title) || slugify(dto.title);
    const existing = await Blog.findOne({ where: { slug } });
    if (existing) throw new AppError('Slug already exists', 409);

    const blog = await Blog.create({
      title: dto.title,
      slug,
      content: stripMediaOrigins(dto.content),
      excerpt: dto.excerpt || null,
      thumbnail: toStoredMediaPath(dto.thumbnail),
      status: dto.status,
      publishedAt: dto.status === 'published' ? new Date() : null,
    });

    if (dto.categoryIds?.length) {
      await blog.$set('categories', dto.categoryIds);
    }

    return this.findById(blog.id as number);
  },

  async update(id: number, dto: UpdateBlogDto): Promise<Blog> {
    const blog = await this.findById(id);

    const nextSlug = dto.slug ? slugify(dto.slug) : blog.slug;
    if (nextSlug !== blog.slug) {
      const existing = await Blog.findOne({ where: { slug: nextSlug } });
      if (existing) throw new AppError('Slug already exists', 409);
    }

    const wasPublished = blog.status !== 'published' && dto.status === 'published';

    await blog.update({
      ...dto,
      slug: nextSlug,
      content: dto.content !== undefined ? stripMediaOrigins(dto.content) : blog.content,
      thumbnail:
        dto.thumbnail !== undefined ? toStoredMediaPath(dto.thumbnail) : blog.thumbnail,
      publishedAt: wasPublished ? new Date() : blog.publishedAt,
    });

    if (dto.categoryIds !== undefined) {
      await blog.$set('categories', dto.categoryIds);
    }

    return this.findById(id);
  },

  async delete(id: number): Promise<string> {
    const blog = await this.findById(id);
    const slug = blog.slug;
    if (blog.thumbnail) {
      try {
        uploadService.deleteFile(blog.thumbnail);
      } catch {
        // non-critical
      }
    }
    await blog.destroy();
    return slug;
  },

  async recordView(blogId: number, ipHash: string): Promise<void> {
    const recentView = await ViewLog.findOne({
      where: {
        blogId,
        ipHash,
        createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (!recentView) {
      await ViewLog.create({ blogId, ipHash, processed: false });
    }
  },

  async getAllCategories(): Promise<BlogCategory[]> {
    return BlogCategory.findAll({ order: [['name', 'ASC']] });
  },

  async createCategory(dto: CreateCategoryDto): Promise<BlogCategory> {
    const slug = slugify(dto.slug || dto.name);
    return BlogCategory.create({ ...dto, slug });
  },

  async updateCategory(id: number, dto: UpdateCategoryDto): Promise<BlogCategory> {
    const cat = await BlogCategory.findByPk(id);
    if (!cat) throw new AppError('Category not found', 404);
    const nextSlug = dto.slug ? slugify(dto.slug) : dto.name ? slugify(dto.name) : cat.slug;
    if (nextSlug !== cat.slug) {
      const existing = await BlogCategory.findOne({ where: { slug: nextSlug } });
      if (existing) throw new AppError('Slug already exists', 409);
    }
    await cat.update({ ...dto, slug: nextSlug });
    return cat;
  },

  async deleteCategory(id: number): Promise<void> {
    const cat = await BlogCategory.findByPk(id);
    if (!cat) throw new AppError('Category not found', 404);
    await cat.destroy();
  },

  async getSyncIndex() {
    const categories = await BlogCategory.findAll({ order: [['id', 'ASC']] });
    const categoriesHash = JSON.stringify(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        color: c.color,
        description: c.description,
      }))
    );

    const blogs = await Blog.findAll({
      where: { status: 'published' },
      include: [{ model: BlogCategory, as: 'categories', through: { attributes: [] } }],
      order: [['id', 'ASC']],
    });

    return {
      categoriesHash,
      posts: blogs.map((blog) => ({
        id: blog.id,
        slug: slugify(blog.slug),
        updatedAt: blog.updatedAt,
        categoryIds: (blog.categories ?? []).map((c) => c.id as number),
      })),
    };
  },
};
