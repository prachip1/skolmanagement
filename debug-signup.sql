-- Debug and fix signup issues
-- Run this in your Supabase SQL Editor

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- Drop ALL existing policies on users table to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Temporarily disable RLS to test if the issue is with policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create a simple test to see if we can insert users
-- (This will help us determine if the issue is with RLS or something else)

-- Now let's create a minimal set of policies that should work
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile (this is crucial for signup)
CREATE POLICY "Enable insert for users based on user_id" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Enable read access for users based on user_id" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on user_id" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow service role to do everything (for admin operations)
CREATE POLICY "Enable all for service role" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Check if the trigger exists and drop it if it does
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Let's also check the table structure
\d public.users; 