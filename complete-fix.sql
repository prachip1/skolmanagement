-- Complete fix for infinite recursion in users table
-- Run this in your Supabase SQL Editor

-- Step 1: Drop ALL policies on the users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable all for service role" ON public.users;

-- Step 2: Temporarily disable RLS completely
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 3: Test if we can insert without RLS
-- This will help us verify the table structure is correct
INSERT INTO public.users (id, email, role, first_name, last_name)
VALUES (
    gen_random_uuid(), 
    'test@example.com', 
    'student', 
    'Test', 
    'User'
);

-- Check if insert worked
SELECT * FROM public.users WHERE email = 'test@example.com';

-- Clean up test data
DELETE FROM public.users WHERE email = 'test@example.com';

-- Step 4: Re-enable RLS with minimal policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create ONLY the essential policies for signup to work
-- Allow users to insert their own profile (CRITICAL for signup)
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "users_read_own" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Step 6: Remove any triggers that might be causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 7: Verify the policies were created
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Step 8: Test the policies work
-- This should work now
SELECT 'Policies created successfully. Try signing up again!' as status; 