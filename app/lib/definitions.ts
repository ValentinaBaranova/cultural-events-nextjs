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
    singleRoomVenue?: boolean;
};

export type PaymentChannel = {
    name?: string | null;
    url?: string | null;
};

export type CulturalEvent = {
    id: string; // Unique identifier for the event
    name: string; // Name of the event (Spanish)
    nameEn?: string | null; // Name in English (optional)
    date: string; // Start date of the event in ISO format
    description: string; // A brief description of the event (Spanish)
    descriptionEn?: string | null; // Description in English (optional)
    venueDetail?: string | null; // Detailed venue description (room, address, etc.)
    image: string; //Filename of event image
    startTime?: string; // (Optional) Start time of the event, in "HH:mm" format
    endDate?: string; // (Optional) End date of the event, in ISO format
    type: string; // Slug of event type
    imageExists: boolean;
    seriesKey?: string | null;
    isFree?: boolean | null; // (Optional) Whether the event is free
    priceText?: string | null; // (Optional) Price text, e.g., "$5.000"
    venue?: Venue | null; // Optional venue info
    instagramId?: string | null; // Optional Instagram post shortcode
    instagramPostId?: string | null; // Optional internal Instagram post UUID (for admin actions)
    paymentChannels?: PaymentChannel[]; // Optional ticket purchase links
    tags?: string[]; // Optional list of tag slugs
    isForChildren?: boolean; // Whether the event is for children
    otherDates?: EventDate[];
};

export type EventDate = {
    id: string;
    date: string;
    startTime?: string | null;
    endDate?: string | null;
};
