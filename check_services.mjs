
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://noadnvhqsgnfdcufagdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vYWRudmhxc2duZmRjdWZhZ2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTY1NjMsImV4cCI6MjA4NzM3MjU2M30.NBvnFJDY8fnErcfsoE0H88aZFNxDuzy0nFpl7cjexeg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkServices() {
    const { data, error } = await supabase
        .from('services')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Services:', JSON.stringify(data, null, 2));
}

checkServices();
