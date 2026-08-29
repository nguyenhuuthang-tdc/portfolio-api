import { Op } from 'sequelize';
import { Project } from './project.model';
import { AppError } from '../../middleware/error.middleware';
import { CreateProjectDto, UpdateProjectDto } from './project.types';
import { slugify } from '../../utils/slug';
import { stripMediaOrigins } from '../../utils/media-path';

export const projectService = {
  async findAll(includeArchived = false): Promise<Project[]> {
    const where = includeArchived ? {} : { status: { [Op.ne]: 'archived' } };
    return Project.findAll({
      where,
      order: [['order', 'ASC'], ['createdAt', 'DESC']],
    });
  },

  async findBySlug(slug: string, includeArchived = false): Promise<Project> {
    const needle = slugify(decodeURIComponent(slug));
    const visibilityWhere = includeArchived ? {} : { status: { [Op.ne]: 'archived' } };
    const exact = await Project.findOne({ where: { slug: needle, ...visibilityWhere } });
    if (exact) return exact;
    const rows = await Project.findAll({ where: visibilityWhere });
    const project = rows.find((row) => slugify(row.slug) === needle);
    if (!project) throw new AppError('Project not found', 404);
    return project;
  },

  async findById(id: number, includeArchived = false): Promise<Project> {
    const project = await Project.findByPk(id);
    if (!project || (!includeArchived && project.status === 'archived')) {
      throw new AppError('Project not found', 404);
    }
    return project;
  },

  async create(dto: CreateProjectDto): Promise<Project> {
    const slug = slugify(dto.slug || dto.title);
    const existing = await Project.findOne({ where: { slug } });
    if (existing) throw new AppError('Slug already exists', 409);
    return Project.create({
      ...dto,
      slug,
      thumbnail: null,
      detailContent: dto.detailContent ? stripMediaOrigins(dto.detailContent) : dto.detailContent,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
    });
  },

  async update(id: number, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findById(id, true);
    const nextSlug = dto.slug ? slugify(dto.slug) : project.slug;
    if (nextSlug !== project.slug) {
      const existing = await Project.findOne({ where: { slug: nextSlug } });
      if (existing) throw new AppError('Slug already exists', 409);
    }
    await project.update({
      ...dto,
      slug: nextSlug,
      thumbnail: null,
      detailContent:
        dto.detailContent !== undefined
          ? dto.detailContent
            ? stripMediaOrigins(dto.detailContent)
            : dto.detailContent
          : project.detailContent,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : project.completedAt,
    });
    return project;
  },

  async delete(id: number): Promise<void> {
    const project = await this.findById(id, true);
    await project.destroy();
  },

  async reorder(ids: number[]): Promise<void> {
    await Promise.all(
      ids.map((id, index) => Project.update({ order: index }, { where: { id } }))
    );
  },

  async getSyncIndex() {
    const projects = await Project.findAll({
      where: { status: { [Op.ne]: 'archived' } },
      order: [['id', 'ASC']],
    });
    return {
      projects: projects.map((project) => ({
        id: project.id,
        slug: slugify(project.slug),
        updatedAt: project.updatedAt,
      })),
    };
  },

  async repairSlugs(): Promise<void> {
    const projects = await Project.findAll();
    for (const project of projects) {
      const next = slugify(project.slug);
      if (next && next !== project.slug) {
        const clash = await Project.findOne({ where: { slug: next } });
        if (!clash) await project.update({ slug: next });
      }
    }
  },
};
