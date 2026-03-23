import { z } from 'zod';

export const policyFileSchema = z.object({
  id: z.string().uuid(),
  sharepointItemId: z.string().min(1),
  name: z.string().min(1),
  fileType: z.enum(['pdf', 'docx', 'pptx', 'other']),
  version: z.string(),
  acknowledged: z.boolean(),
  acknowledgedAt: z.string().nullable(),
});

export type PolicyFileSchema = z.infer<typeof policyFileSchema>;
