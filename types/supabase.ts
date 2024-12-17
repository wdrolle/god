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