-- Create a function to handle user creation without RLS issues
-- Run this in your Supabase SQL Editor

-- Create the function
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  user_first_name TEXT,
  user_last_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Insert the user profile
  INSERT INTO public.users (id, email, role, first_name, last_name)
  VALUES (user_id, user_email, user_role, user_first_name, user_last_name);
  
  -- Return the created user data
  SELECT json_build_object(
    'id', id,
    'email', email,
    'role', role,
    'first_name', first_name,
    'last_name', last_name,
    'created_at', created_at
  ) INTO result
  FROM public.users
  WHERE id = user_id;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Test the function
-- SELECT public.create_user_profile(
--   gen_random_uuid(),
--   'test@example.com',
--   'student',
--   'Test',
--   'User'
-- ); 