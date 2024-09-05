import { z } from "zod";

export enum OnDayHour {
    DAY = "day",
    NIGHT = "night",
}
const OnDayHourEnum = z.nativeEnum(OnDayHour);
type OnDayHourEnum = z.infer<typeof OnDayHourEnum>;

export enum UserActionType {
    REMINDER = "reminder",
    TASK = "task"
}
const UserActionTypeEnum = z.nativeEnum(UserActionType);
type UserActionTypeEnum = z.infer<typeof UserActionTypeEnum>;

export enum FrequencyType {
    HOUR = "hour",
    DAY = "day",
    WEEK = "week",
    MONTH = "month",
    YEAR = "year",
}
const FrequencyTypeEnum = z.nativeEnum(FrequencyType);
type FrequencyTypeEnum = z.infer<typeof FrequencyTypeEnum>;

export enum Category {
    HAIR = "Hair Care",
    SKIN = "Skin Care",
    BODY = "Body Care",
    NAIL = "Nail Care",
    MIND = "Mind Care"
}
const CategoryEnum = z.nativeEnum(Category);
type CategoryEnum = z.infer<typeof CategoryEnum>;

export const FrequencySchema = z.object({
    frequency: z.number(),
    frequency_type: FrequencyTypeEnum,
    on: z.array(OnDayHourEnum).optional(),
    special: z.boolean().optional().default(false),
});
export type Frequency = z.infer<typeof FrequencySchema>;

export const UserActionFrequencySchema = z.object({
    frequency: z.number(),
    frequency_type: FrequencyTypeEnum,
    on: z.array(OnDayHourEnum).optional(),
    for: z.number().optional(),
    until: z.date().optional(),
});
export type UserActionFrequency = z.infer<typeof UserActionFrequencySchema>;

export const CreateActionSchema = z.object({
    category: CategoryEnum,
    sub_category: z.string(),
    name: z.string(),
    suggested_frequency: FrequencySchema.optional(),
    estimated_starting_cost: z.number().optional(),
    estimated_ending_cost: z.number().optional(),
    dificultity: z.number(),
});
export type CreateAction = z.infer<typeof CreateActionSchema>;

export const ActionSchema = CreateActionSchema.extend({
    id: z.number(),
});
export type Action = z.infer<typeof ActionSchema>;

export const CreateUserActionSchema = z.object({
    action_id: z.number(),
    type: UserActionTypeEnum,
    start_at: z.date(),
    end_at: z.date().optional(),
    all_day: z.boolean(),
    recurrence: z.boolean(),
    frequency: UserActionFrequencySchema.optional(),
});
export type CreateUserAction = z.infer<typeof CreateUserActionSchema>;

export const UpdateUserActionSchema = CreateUserActionSchema.extend({
    id: z.number(),
});
export type UpdateUserAction = z.infer<typeof UpdateUserActionSchema>;

export const UserActionSchema = CreateUserActionSchema.extend({
    id: z.number(),
    user_id: z.string(),
    group_id: z.string(),
});
export type UserAction = z.infer<typeof UserActionSchema>;

export const BasicActionDisplay = z.object({
    name: z.string(),
    category: CategoryEnum,
})
export const UserActionDisplaySchema = z.object({
    actions: BasicActionDisplay,
    ...UserActionSchema.shape
});
export type UserActionDisplay = z.infer<typeof UserActionDisplaySchema>;