
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://noadnvhqsgnfdcufagdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vYWRudmhxc2duZmRjdWZhZ2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTY1NjMsImV4cCI6MjA4NzM3MjU2M30.NBvnFJDY8fnErcfsoE0H88aZFNxDuzy0nFpl7cjexeg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    const tables = ['services', 'bookings', 'clients'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error on ${table}:`, error.message);
        } else {
            console.log(`${table} found, count:`, data.length);
        }
    }
}

checkTables();
