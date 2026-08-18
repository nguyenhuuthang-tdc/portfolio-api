import { Project } from './project.model';
import { AppError } from '../../middleware/error.middleware';
import { CreateProjectDto, UpdateProjectDto } from './project.types';

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

export const projectService = {
  async findAll(includeArchived = false): Promise<Project[]> {
    const where = includeArchived ? {} : {};
    return Project.findAll({
      where,
      order: [['order', 'ASC'], ['createdAt', 'DESC']],
    });
  },

  async findBySlug(slug: string): Promise<Project> {
    const project = await Project.findOne({ where: { slug } });
    if (!project) throw new AppError('Project not found', 404);
    return project;
  },

  async findById(id: number): Promise<Project> {
    const project = await Project.findByPk(id);
    if (!project) throw new AppError('Project not found', 404);
    return project;
  },

  async create(dto: CreateProjectDto): Promise<Project> {
    const slug = dto.slug || generateSlug(dto.title);
    const existing = await Project.findOne({ where: { slug } });
    if (existing) throw new AppError('Slug already exists', 409);
    return Project.create({
      ...dto,
      slug,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
    });
  },

  async update(id: number, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findById(id);
    if (dto.slug && dto.slug !== project.slug) {
      const existing = await Project.findOne({ where: { slug: dto.slug } });
      if (existing) throw new AppError('Slug already exists', 409);
    }
    await project.update({
      ...dto,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : project.completedAt,
    });
    return project;
  },

  async delete(id: number): Promise<void> {
    const project = await this.findById(id);
    await project.destroy();
  },

  async reorder(ids: number[]): Promise<void> {
    await Promise.all(
      ids.map((id, index) => Project.update({ order: index }, { where: { id } }))
    );
  },
};
