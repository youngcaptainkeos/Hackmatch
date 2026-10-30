import { z } from 'zod';
export const text = (min, max) => z.string().trim().min(min).max(max);
export const id = z.coerce.number().int().positive().max(4294967295);
export const account = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(10).max(128),
});
export const skills = z
  .array(text(1, 40).transform((s) => s.toLowerCase()))
  .max(15)
  .transform((a) => [...new Set(a)]);
export const profileSchema = z.object({
  bio: text(10, 2000),
  preferred_role: text(2, 80),
  availability: z.enum(['Mornings', 'Evenings', 'Weekends', 'Flexible']),
  skills,
  interests: z.array(text(1, 40)).max(8),
  projects: z
    .array(
      z.object({
        title: text(2, 80),
        description: text(5, 500),
        url: z.union([
          z.literal(''),
          z.url().refine((s) => ['http:', 'https:'].includes(new URL(s).protocol)),
        ]),
      })
    )
    .max(5),
  discoverable: z.boolean(),
});
export const openingSchema = z.object({
  team_id: id,
  title: text(2, 80),
  description: text(5, 2000),
  required_skills: skills.refine((s) => s.length > 0, 'Add at least one required skill'),
  preferred_availability: z.enum(['Mornings', 'Evenings', 'Weekends', 'Flexible']),
});
