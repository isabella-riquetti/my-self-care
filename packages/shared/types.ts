import { z } from "zod";

export enum FrequencyType {
    DAY = "day",
    WEEK = "week",
    MONTH = "month",
    YEAR = "year",
}
const FrequencyTypeEnum = z.nativeEnum(FrequencyType);
type FrequencyTypeEnum = z.infer<typeof FrequencyTypeEnum>;

export const FrequencySchema = z.object({
    frequency: z.number().optional().nullable(),
    frequency_type: FrequencyTypeEnum,
    on: z.array(z.any()),
    on_type: FrequencyTypeEnum,
    special: z.boolean(),
});
export type Frequency = z.infer<typeof FrequencySchema>;

export const CreateActionSchema = z.object({
    category: z.string(),
    name: z.string(),
    suggested_frequency: FrequencySchema.optional().nullable(),
    estimated_starting_cost: z.number().nullable(),
    estimated_ending_cost: z.number().nullable(),
});
export type CreateAction = z.infer<typeof CreateActionSchema>;

export const ActionSchema = CreateActionSchema.extend({
    id: z.number(),
});
export type Action = z.infer<typeof ActionSchema>;
