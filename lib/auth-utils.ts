import { supabase } from './supabase'

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  cnic: string
  phone: string
  dateOfBirth: string
}

export interface SignInData {
  email: string
  password: string
}

export const authUtils = {
  async signUp({ email, password, firstName, lastName, cnic, phone, dateOfBirth }: SignUpData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          cnic: cnic.replace(/\D/g, ''),
          phone: phone.replace(/\D/g, ''),
          date_of_birth: dateOfBirth,
        }
      }
    })
    
    if (error) throw error
    
    // If user is created successfully, create user_info record
    if (data.user) {
      try {
        await this.createUserProfile(data.user.id, { email, firstName, lastName, cnic, password })
      } catch (profileError) {
        console.warn('Failed to create user profile:', profileError)
        // Don't throw error here as auth user is already created
      }
    }
    
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
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_info')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  async updateUserProfile(userId: string, updates: Partial<SignUpData>) {
    const { data, error } = await supabase
      .from('user_info')
      .update({
        first_name: updates.firstName?.trim(),
        last_name: updates.lastName?.trim(),
        full_name: updates.firstName && updates.lastName 
          ? `${updates.firstName.trim()} ${updates.lastName.trim()}` 
          : undefined,
        cnic: updates.cnic?.replace(/\D/g, ''),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    return data
  },

  async createUserProfile(userId: string, userData: SignUpData) {
    const { data, error } = await supabase
      .from('user_info')
      .insert({
        user_id: userId,
        email: userData.email,
        first_name: userData.firstName.trim(),
        last_name: userData.lastName.trim(),
        cnic: userData.cnic.replace(/\D/g, ''),
        phone: userData.phone.replace(/\D/g, ''),
        date_of_birth: userData.dateOfBirth
      })
      .select()
    
    if (error) throw error
    return data
  }
}
