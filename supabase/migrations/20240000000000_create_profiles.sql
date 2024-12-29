-- Drop existing table and policies
drop policy if exists "Enable read access for all users" on profiles;
drop policy if exists "Enable insert access for users based on user_id" on profiles;
drop policy if exists "Enable update access for users based on user_id" on profiles;
drop table if exists profiles;

-- Create profiles table
create table profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
on profiles for select
using (true);

create policy "Users can create their own profile"
on profiles for insert
with check (true);

create policy "Users can update their own profile"
on profiles for update using (
    auth.uid() = id
);

-- Grant necessary permissions
grant usage on schema public to authenticated, anon;
grant all on profiles to authenticated, anon;

-- Create trigger to handle updated_at
create or replace function handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
    before update on profiles
    for each row
    execute procedure handle_updated_at(); 