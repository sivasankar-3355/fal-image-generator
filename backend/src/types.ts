import { z } from 'zod'

export const genders = ['male', 'female', 'other'] as const;
export const ethinities = ['asian', 'white', 'black', 'other'] as const;
export const eyeColors = ['brown', 'blue', 'green', 'other'] as const;

export const trainSchema = z.object({
    name: z.string(),
    gender: z.enum(genders),
    age: z.number(),
    ethinicity: z.enum(ethinities),
    eyeColor: z.enum(eyeColors),
    isBald: z.boolean(),
})

export const generateImageFromPromptSchema = z.object({
    prompt: z.string(),
    character: z.string(),
    count: z.number().default(1)
})

export const generateImageFromPackSchema = z.object({
    packId: z.string(),
    userModel: z.string(),
    count: z.number().default(1)
}) 