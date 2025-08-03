-- Fix RLS Policies to resolve infinite recursion
-- Run this in your Supabase SQL Editor

-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Teachers can manage their courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can manage all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can manage all grades" ON public.grades;

-- Create new policies that avoid infinite recursion
-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow admins to view all users (using auth.users table instead of public.users)
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
    );

-- Allow admins to manage all users
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
    );

-- Fix course policies
CREATE POLICY "Teachers can manage their courses" ON public.courses
    FOR ALL USING (
        teacher_id = auth.uid() OR
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
    );

-- Fix enrollment policies
CREATE POLICY "Admins can manage all enrollments" ON public.enrollments
    FOR ALL USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
    );

-- Fix attendance policies
CREATE POLICY "Admins can manage all attendance" ON public.attendance
    FOR ALL USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
    );

-- Fix grades policies
CREATE POLICY "Admins can manage all grades" ON public.grades
    FOR ALL USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
    );

-- Disable the trigger that was causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; 