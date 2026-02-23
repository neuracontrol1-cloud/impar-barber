-- Create Services Table
create table services (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null,
  duration_minutes integer default 30,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS
alter table services enable row level security;

-- Policies for Services
-- Public can read active services
create policy "Public can view active services" on services
  for select using (active = true);

-- Only authenticated users (admins) can insert/update/delete
-- For simplicity in this MVP, we might allow any authenticated user to edit, 
-- or specific users if we had a roles table. Assuming "authenticated" = "admin" for now.
create policy "Admins can manage services" on services
  for all using (auth.role() = 'authenticated');

-- Seed some initial data
insert into services (name, price, duration_minutes) values
('Corte de cabelo simples', 45, 30),
('Corte de cabelo degrade', 50, 45),
('Corte de cabelo na navalha', 55, 50),
('Barba', 30, 30);
