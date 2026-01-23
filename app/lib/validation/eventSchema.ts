import { z } from 'zod';

export const EventSchema = z.object({
    id: z.string().uuid(), // Ensure ID is a valid UUID
    name: z.string().min(3, "Event name must be at least 3 characters"),
    nameEn: z.string().trim().min(1).nullable().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    venueDetail: z.string().min(3, "Venue detail must be at least 3 characters").nullable().optional(),
    description: z.string().min(10, "Description must be at least 10 characters"),
    descriptionEn: z.string().trim().min(1).nullable().optional(),
    startTime: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    isFree: z.boolean().nullable().optional(),
    priceText: z.string().max(120).nullable().optional(),
    // Accept backend-provided slug without hardcoding enum values
    type: z.string().min(1),
    tags: z.array(z.string()).optional(),
});

export const UpdateEventSchema = EventSchema.omit({ id: true });
