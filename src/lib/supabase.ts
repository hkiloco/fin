import { createClient } from '@supabase/supabase-js'

// These will be set from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          id: string
          name: string
          bank_name: string
          account_type: 'checking' | 'savings' | 'credit' | 'investment'
          balance: number | null
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          bank_name: string
          account_type: 'checking' | 'savings' | 'credit' | 'investment'
          balance?: number | null
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          bank_name?: string
          account_type?: 'checking' | 'savings' | 'credit' | 'investment'
          balance?: number | null
          color?: string | null
          updated_at?: string
        }
      }
    }
  }
}
