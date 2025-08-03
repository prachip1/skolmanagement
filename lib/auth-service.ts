// Alternative auth service using service role for user creation
// This bypasses RLS policies that might be causing infinite recursion

import { createClient } from '@supabase/supabase-js'

// Create a service role client (bypasses RLS)
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This should be in your .env.local
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export const createUserProfile = async (userData: {
  id: string
  email: string
  role: string
  first_name: string
  last_name: string
}) => {
  try {
    console.log('Creating user profile with service role:', userData.id)
    
    const { data, error } = await supabaseService
      .from('users')
      .insert({
        id: userData.id,
        email: userData.email,
        role: userData.role,
        first_name: userData.first_name,
        last_name: userData.last_name,
      })
      .select()

    if (error) {
      console.error('Service role profile creation error:', error)
      throw error
    }

    console.log('Profile created successfully with service role:', data)
    return data
  } catch (error) {
    console.error('Service role error:', error)
    throw error
  }
} 