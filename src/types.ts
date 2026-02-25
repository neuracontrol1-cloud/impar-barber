export interface Service {
    id: string;
    name: string;
    price: number;
    description?: string;
    active?: boolean;
    duration_minutes?: number;
}

export interface UserData {
    name: string;
    email: string;
    phone: string;
}

export interface Booking {
    id: string;
    time: string;
    date: string;
    service_name: string;
    price: number;
    duration_minutes?: number;
    status: 'pending' | 'completed' | 'cancelled';
    reminder_sent?: boolean;
    client: {
        name: string;
        phone: string;
    };
}
