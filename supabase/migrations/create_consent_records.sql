create table if not exists messaging_consent (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  phone_number text not null,
  consent_date timestamp with time zone default now(),
  consent_method text not null,
  consent_url text not null,
  ip_address text,
  is_active boolean default true
); 