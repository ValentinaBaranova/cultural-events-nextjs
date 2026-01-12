export type Barrio = {
    id: string;
    name: string;
    slug: string;
};

export type Venue = {
    id: string;
    name: string;
    slug: string;
    barrio?: Barrio | null;
    latitude?: number | null;
    longitude?: number | null;
    googlePlaceId?: string | null;
};

export type PaymentChannel = {
    name?: string | null;
    url?: string | null;
};

export type CulturalEvent = {
    id: string; // Unique identifier for the event
    name: string; // Name of the event
    date: string; // Start date of the event in ISO format
    description: string; // A brief description of the event
    venueDetail?: string | null; // Detailed venue description (room, address, etc.)
    image: string; //Filename of event image
    startTime?: string; // (Optional) Start time of the event, in "HH:mm" format
    endDate?: string; // (Optional) End date of the event, in ISO format
    type: string; // Slug of event type
    imageExists: boolean;
    isFree?: boolean | null; // (Optional) Whether the event is free
    priceText?: string | null; // (Optional) Price text, e.g., "$5.000"
    venue?: Venue | null; // Optional venue info
    instagramId?: string | null; // Optional Instagram post shortcode
    paymentChannels?: PaymentChannel[]; // Optional ticket purchase links
    tags?: string[]; // Optional list of tag slugs
};
