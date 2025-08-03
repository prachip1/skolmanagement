// Simple auth service that works with regular client
// This approach handles RLS issues by using a different strategy

import { supabase } from './supabase'

export const createUserProfileSimple = async (userData: {
  id: string
  email: string
  role: string
  first_name: string
  last_name: string
}) => {
  try {
    console.log('Creating user profile with simple approach:', userData.id)
    
    // First, try to create the profile directly
    const { data, error } = await supabase
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
      console.error('Profile creation error:', error)
      
      // If it's an RLS error, try a different approach
      if (error.code === '42P17' || error.message.includes('infinite recursion')) {
        console.log('Detected RLS issue, trying alternative approach...')
        
        // Try using a function call instead
        const { data: funcData, error: funcError } = await supabase
          .rpc('create_user_profile', {
            user_id: userData.id,
            user_email: userData.email,
            user_role: userData.role,
            user_first_name: userData.first_name,
            user_last_name: userData.last_name
          })

        if (funcError) {
          console.error('Function call error:', funcError)
          throw funcError
        }

        console.log('Profile created successfully via function:', funcData)
        return funcData
      }
      
      throw error
    }

    console.log('Profile created successfully:', data)
    return data
  } catch (error) {
    console.error('Simple auth error:', error)
    throw error
  }
} 