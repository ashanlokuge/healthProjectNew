import { User } from '@supabase/supabase-js';
import { Profile, UserRole } from '../lib/supabase';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  isDeveloper: boolean;
  setDeveloperMode: (mode: boolean) => void;
  currentRole: UserRole | null;
  setCurrentRole: (role: UserRole | null) => void;
}