// types/supabase.ts
// This file is used to handle the supabase types
// It is used to handle the supabase types that are used to connect to the supabase database and the tables that are used to store the data

export type Database = {
  public: {
    Tables: {
      subscribers: {
        Row: {
          id: string
          phone_number: string
          created_at: string
          consent_date: string
          consent_ip: string
          opt_in_method: string
          consent_message: string
        }
        Insert: {
          id?: string
          phone_number: string
          created_at?: string
          consent_date: string
          consent_ip: string
          opt_in_method: string
          consent_message: string
        }
        Update: {
          id?: string
          phone_number?: string
          created_at?: string
          consent_date?: string
          consent_ip?: string
          opt_in_method?: string
          consent_message?: string
        }
      }
    }
  }
} 