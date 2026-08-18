import { AboutSection } from './about-section.model';
import { Skill } from './skill.model';
import { AppError } from '../../middleware/error.middleware';
import { z } from 'zod';

export const UpsertSectionSchema = z.object({
  content: z.string().min(1),
  label: z.string().max(255).optional(),
});

export const CreateSkillSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  level: z.number().int().min(1).max(5).optional(),
  icon: z.string().max(255).optional(),
  order: z.number().int().default(0),
  isVisible: z.boolean().default(true),
});

export const UpdateSkillSchema = CreateSkillSchema.partial();

export type UpsertSectionDto = z.infer<typeof UpsertSectionSchema>;
export type CreateSkillDto = z.infer<typeof CreateSkillSchema>;
export type UpdateSkillDto = z.infer<typeof UpdateSkillSchema>;

export const aboutService = {
  async getAllSections(): Promise<AboutSection[]> {
    return AboutSection.findAll({ order: [['key', 'ASC']] });
  },

  async getSection(key: string): Promise<AboutSection> {
    const section = await AboutSection.findOne({ where: { key } });
    if (!section) throw new AppError(`Section '${key}' not found`, 404);
    return section;
  },

  async upsertSection(key: string, dto: UpsertSectionDto): Promise<AboutSection> {
    const [section] = await AboutSection.upsert({ key, ...dto });
    return section;
  },

  async getAllSkills(): Promise<Skill[]> {
    return Skill.findAll({
      where: { isVisible: true },
      order: [['order', 'ASC'], ['category', 'ASC']],
    });
  },

  async getAllSkillsAdmin(): Promise<Skill[]> {
    return Skill.findAll({ order: [['order', 'ASC']] });
  },

  async createSkill(dto: CreateSkillDto): Promise<Skill> {
    return Skill.create(dto);
  },

  async updateSkill(id: number, dto: UpdateSkillDto): Promise<Skill> {
    const skill = await Skill.findByPk(id);
    if (!skill) throw new AppError('Skill not found', 404);
    await skill.update(dto);
    return skill;
  },

  async deleteSkill(id: number): Promise<void> {
    const skill = await Skill.findByPk(id);
    if (!skill) throw new AppError('Skill not found', 404);
    await skill.destroy();
  },

  async reorderSkills(ids: number[]): Promise<void> {
    await Promise.all(
      ids.map((id, index) => Skill.update({ order: index }, { where: { id } }))
    );
  },
};
