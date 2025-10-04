import { supabase } from './supabase'

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  cnic: string
}

export interface SignInData {
  email: string
  password: string
}

export const authUtils = {
  async signUp({ email, password, firstName, lastName, cnic }: SignUpData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          cnic: cnic.replace(/\D/g, ''),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
        }
      }
    })
    
    if (error) throw error
    return data
  },

  async signIn({ email, password }: SignInData) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }
}
