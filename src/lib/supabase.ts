import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

const supabaseUrl = 'https://noadnvhqsgnfdcufagdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vYWRudmhxc2duZmRjdWZhZ2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTY1NjMsImV4cCI6MjA4NzM3MjU2M30.NBvnFJDY8fnErcfsoE0H88aZFNxDuzy0nFpl7cjexeg';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveBooking(bookingData: {
    client: { name: string; email: string; phone: string };
    service: { id: string; name: string; price: number };
    date: Date;
    time: string;
}) {
    // 1. Check/Insert Client
    const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('email', bookingData.client.email)
        .single();

    let clientId = client?.id;

    if (!clientId) {
        const { data: newClient, error: createClientError } = await supabase
            .from('clients')
            .insert({
                name: bookingData.client.name,
                email: bookingData.client.email,
                phone: bookingData.client.phone
            })
            .select('id')
            .single();

        if (createClientError) throw createClientError;
        clientId = newClient.id;
    }

    // 2. Insert Booking
    const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
            client_id: clientId,
            service_id: bookingData.service.id,
            service_name: bookingData.service.name,
            price: bookingData.service.price,
            date: bookingData.date.toISOString(),
            time: bookingData.time
        });

    if (bookingError) throw bookingError;

    return true;
}

export async function getBookingsForDate(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
        .from('bookings')
        .select('time')
        .gte('date', startOfDay.toISOString())
        .lte('date', endOfDay.toISOString())
        .neq('status', 'cancelled');

    if (error) {
        console.error('Error fetching bookings:', error);
        return [];
    }

    return data.map(booking => booking.time);
}

export async function blockTimes(dates: Date[], times: string[]) {
    // 1. Get/Create "System" Client for Blocks
    const { data: client, error: findError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', 'admin@imparbarbearia.com') // System email
        .maybeSingle();

    if (findError) {
        console.error('Error finding admin client:', findError);
        throw findError;
    }

    let clientId = client?.id;

    if (!clientId) {
        const { data: newClient, error: createError } = await supabase
            .from('clients')
            .insert({
                name: 'Bloqueio Administrativo',
                email: 'admin@imparbarbearia.com',
                phone: '00000000000'
            })
            .select('id')
            .single();

        if (createError) {
            // Handle race condition where client might have been created blocked by RLS or parallel request
            if (createError.code === '23505') { // Unique violation
                const { data: retryClient } = await supabase
                    .from('clients')
                    .select('id')
                    .eq('email', 'admin@imparbarbearia.com')
                    .single();
                if (retryClient) clientId = retryClient.id;
                else throw createError;
            } else {
                console.error('Error creating admin client:', createError);
                throw createError;
            }
        } else {
            clientId = newClient.id;
        }
    }

    // 2. Get/Create "System" Service for Blocks
    const { data: service } = await supabase
        .from('services')
        .select('id')
        .eq('name', 'Bloqueio')
        .maybeSingle();

    let serviceId = service?.id;

    if (!serviceId) {
        const { data: newService, error: createServiceError } = await supabase
            .from('services')
            .insert({
                name: 'Bloqueio',
                price: 0,
                // duration: '30', // Removed as column doesn't exist
                active: false // Hidden from public selection
            })
            .select('id')
            .single();

        if (createServiceError) {
            console.error('Error creating block service:', createServiceError);
            throw createServiceError;
        }
        serviceId = newService.id;
    }

    // 3. Prepare Batch Insert
    const bookingsToInsert = [];

    for (const date of dates) {
        for (const time of times) {
            bookingsToInsert.push({
                client_id: clientId,
                service_id: serviceId, // Now using a valid ID
                service_name: 'Bloqueio ADM',
                price: 0,
                date: format(date, 'yyyy-MM-dd'),
                time: time,
                status: 'blocked' // New status
            });
        }
    }

    // 3. Insert
    const { error } = await supabase
        .from('bookings')
        .insert(bookingsToInsert);

    if (error) throw error;
    return true;
}
