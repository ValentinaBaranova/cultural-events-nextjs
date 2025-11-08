export type CulturalEvent = {
    id: string; // Unique identifier for the event
    name: string; // Name of the event
    date: string; // Start date of the event in ISO format
    description: string; // A brief description of the event
    location: string; // Location where the event takes place
    image: string; //Filename of event image
    startTime?: string; // (Optional) Start time of the event, in "HH:mm" format
    endDate?: string; // (Optional) End date of the event, in ISO format
    type: string; // Slug of event type
    imageExists: boolean;
};
