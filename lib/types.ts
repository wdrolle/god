// lib/types.ts

export interface UserRole {
    USER: 'USER';
    ADMIN: 'ADMIN';
    STAKEHOLDER: 'STAKEHOLDER';
    MODERATOR: 'MODERATOR';
  }
  
  export interface SubscriptionStatus {
    ACTIVE: 'ACTIVE';
    PAUSED: 'PAUSED';
    CANCELLED: 'CANCELLED';
    TRIAL: 'TRIAL';
  }
  
  export interface User {
    id: string;
    auth_user_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    role: keyof UserRole;
    subscription_status: keyof SubscriptionStatus;
    created_at: Date;
    updated_at: Date;
  }
  
  export interface UserPreferences {
    id: string;
    user_id: string;
    theme_preferences: string[];
    blocked_themes: string[];
    preferred_bible_version: string;
    message_length_preference: string;
    created_at: Date;
    updated_at: Date;
  }
  
  export interface Subscription {
    id: string;
    user_id: string;
    status: keyof SubscriptionStatus;
    theme_ids: string[];
    preferred_time: Date;
    frequency: string;
    trial_ends_at: Date;
    last_message_at: Date;
    next_message_at: Date;
    subscription_ends_at: Date;
    payment_status: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    created_at: Date;
    updated_at: Date;
    cancelled_at: Date | null;
  }
  
  export interface LoginResponse {
    user: User | null;
    session: any | null;
    error: string | null;
  }
  
  export interface Database {
    public: {
      Tables: {
        god_users: {
          Row: User;
          Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<User, 'id'>>;
        };
        god_user_preferences: {
          Row: UserPreferences;
          Insert: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<UserPreferences, 'id'>>;
        };
        god_subscriptions: {
          Row: Subscription;
          Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<Subscription, 'id'>>;
        };
      };
      Views: {
        [key: string]: {
          Row: Record<string, unknown>;
          Insert: Record<string, unknown>;
          Update: Record<string, unknown>;
        };
      };
      Functions: {
        [key: string]: unknown;
      };
      Enums: {
        user_role_enum: keyof UserRole;
        subscription_status_enum: keyof SubscriptionStatus;
      };
    };
  }
  
  export interface FormSchema {
    email: string;
    password: string;
    // Add any other fields your form needs
  }
  
  // If you're using zod, it might look like this:
  import { z } from 'zod';
  
  export const FormSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });
  
  export type FormSchemaType = z.infer<typeof FormSchema>;