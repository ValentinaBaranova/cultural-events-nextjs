import { z } from 'zod';

export const EventSchema = z.object({
    id: z.string().uuid(), // Ensure ID is a valid UUID
    name: z.string().min(3, "Event name must be at least 3 characters"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    location: z.string().min(3, "Location must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    startTime: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    isFree: z.boolean().nullable().optional(),
    priceText: z.string().max(120).nullable().optional(),
    type: z.enum([
        'performance',
        'exhibition',
        'festival',
        'workshop',
        'concert',
        'social',
        'tour',
        'wellness'
    ]),
});

export const UpdateEventSchema = EventSchema.omit({ id: true });
