-- Test database connection and table structure
-- Run this in your Supabase SQL Editor

-- Check if the users table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Check existing policies
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Test if we can insert a user (this will help identify the issue)
-- Note: This is just a test, we'll delete it afterward
INSERT INTO public.users (id, email, role, first_name, last_name)
VALUES (
    gen_random_uuid(), 
    'test@example.com', 
    'student', 
    'Test', 
    'User'
);

-- Check if the insert worked
SELECT * FROM public.users WHERE email = 'test@example.com';

-- Clean up the test data
DELETE FROM public.users WHERE email = 'test@example.com'; 