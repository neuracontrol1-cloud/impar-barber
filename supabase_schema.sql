-- Create Clients Table
create table clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text unique not null,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Bookings Table
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) not null,
  service_id text not null,
  service_name text not null,
  price numeric not null,
  duration_minutes integer default 30,
  date date not null,
  time text not null,
  status text default 'confirmed' not null,
  reminder_sent boolean default false,
  is_mensalista boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security (good practice)
alter table clients enable row level security;
alter table bookings enable row level security;

-- Allow public access for this demo (or create specific policies)
create policy "Allow public insert clients" on clients for insert with check (true);
create policy "Allow public read clients" on clients for select using (true);
create policy "Allow public insert bookings" on bookings for insert with check (true);
create policy "Allow public read bookings" on bookings for select using (true);

-- Add reminder_sent column to bookings table (for ManyChat integration)
alter table bookings add column reminder_sent boolean default false;
