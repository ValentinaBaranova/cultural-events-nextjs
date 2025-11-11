export type Place = {
    id: string;
    name: string;
    slug: string;
};

export type CulturalEvent = {
    id: string; // Unique identifier for the event
    name: string; // Name of the event
    date: string; // Start date of the event in ISO format
    description: string; // A brief description of the event
    placeDetail: string; // Detailed place description (room, address, etc.)
    image: string; //Filename of event image
    startTime?: string; // (Optional) Start time of the event, in "HH:mm" format
    endDate?: string; // (Optional) End date of the event, in ISO format
    type: string; // Slug of event type
    imageExists: boolean;
    isFree?: boolean | null; // (Optional) Whether the event is free
    priceText?: string | null; // (Optional) Price text, e.g., "$5.000"
    place?: Place | null; // Optional place info
};
