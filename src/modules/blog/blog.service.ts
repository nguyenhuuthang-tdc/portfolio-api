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

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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

  async findBySlug(slug: string): Promise<Blog> {
    const blog = await Blog.findOne({
      where: { slug },
      include: [{ model: BlogCategory, as: 'categories', through: { attributes: [] } }],
    });
    if (!blog) throw new AppError('Blog not found', 404);
    return blog;
  },

  async findById(id: number): Promise<Blog> {
    const blog = await Blog.findByPk(id, {
      include: [{ model: BlogCategory, as: 'categories', through: { attributes: [] } }],
    });
    if (!blog) throw new AppError('Blog not found', 404);
    return blog;
  },

  async create(dto: CreateBlogDto): Promise<Blog> {
    const slug = dto.slug || generateSlug(dto.title);
    const existing = await Blog.findOne({ where: { slug } });
    if (existing) throw new AppError('Slug already exists', 409);

    const blog = await Blog.create({
      title: dto.title,
      slug,
      content: dto.content,
      excerpt: dto.excerpt || null,
      thumbnail: dto.thumbnail || null,
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

    if (dto.slug && dto.slug !== blog.slug) {
      const existing = await Blog.findOne({ where: { slug: dto.slug } });
      if (existing) throw new AppError('Slug already exists', 409);
    }

    const wasPublished = blog.status !== 'published' && dto.status === 'published';

    await blog.update({
      ...dto,
      publishedAt: wasPublished ? new Date() : blog.publishedAt,
    });

    if (dto.categoryIds !== undefined) {
      await blog.$set('categories', dto.categoryIds);
    }

    return this.findById(id);
  },

  async delete(id: number): Promise<void> {
    const blog = await this.findById(id);
    if (blog.thumbnail) {
      try {
        const publicPath = blog.thumbnail.startsWith('http')
          ? new URL(blog.thumbnail).pathname
          : blog.thumbnail;
        uploadService.deleteFile(publicPath);
      } catch {
        // non-critical
      }
    }
    await blog.destroy();
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
    const slug = dto.slug || generateSlug(dto.name);
    return BlogCategory.create({ ...dto, slug });
  },

  async updateCategory(id: number, dto: UpdateCategoryDto): Promise<BlogCategory> {
    const cat = await BlogCategory.findByPk(id);
    if (!cat) throw new AppError('Category not found', 404);
    if (dto.slug && dto.slug !== cat.slug) {
      const existing = await BlogCategory.findOne({ where: { slug: dto.slug } });
      if (existing) throw new AppError('Slug already exists', 409);
    }
    await cat.update({ ...dto, slug: dto.slug || (dto.name ? generateSlug(dto.name) : cat.slug) });
    return cat;
  },

  async deleteCategory(id: number): Promise<void> {
    const cat = await BlogCategory.findByPk(id);
    if (!cat) throw new AppError('Category not found', 404);
    await cat.destroy();
  },
};
