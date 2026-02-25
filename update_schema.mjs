
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://noadnvhqsgnfdcufagdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vYWRudmhxc2duZmRjdWZhZ2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTY1NjMsImV4cCI6MjA4NzM3MjU2M30.NBvnFJDY8fnErcfsoE0H88aZFNxDuzy0nFpl7cjexeg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSchema() {
    const queries = [
        "alter table services add column if not exists duration_minutes integer default 30;",
        "alter table bookings add column if not exists duration_minutes integer default 30;"
    ];

    for (const query of queries) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: query }).catch(async (e) => {
            // Fallback if rpc exec_sql doesn't exist (it usually doesn't by default)
            // Since I can't run arbitrary SQL easily without RPC, I'll just try to insert/select to see if it works later or warn the user.
            return { error: e };
        });
        if (error) console.log("Note: Could not run SQL directly via RPC. The user might need to run this in the Dashboard.");
    }
}

updateSchema();
