import * as z from 'zod'

export const devRegisterAgentFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  apiKey: z.string().trim().min(1, 'API key is required'),
  locationLabel: z.string().trim().optional(),
})

export type DevRegisterAgentFormInput = z.infer<typeof devRegisterAgentFormSchema>
