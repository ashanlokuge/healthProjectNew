import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile, UserRole } from '../lib/supabase';
import { AuthContextType } from './AuthTypes';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
          setCurrentRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      console.log('🔍 Loading profile for user:', userId);
      
      // First check if profile exists
      const { data: profile, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (queryError) {
        console.error('Error querying profile:', queryError);
        throw queryError;
      }

      console.log('Found profile:', profile);

      if (!profile) {
        console.error('No profile found for user:', userId);
        setProfile(null);
        setCurrentRole(null);
        return;
      }

      console.log('Setting active profile:', profile);
      
      setProfile(profile);
      setCurrentRole(profile?.role || null);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
      setCurrentRole(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in with:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
    console.log('✅ Sign in successful:', data.user?.id);
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      console.log('Starting sign up process...', { email, fullName, role });
      
      // First create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('Error during auth signup:', error);
        throw error;
      }

      console.log('Auth signup successful:', data);

      if (!data.user) {
        throw new Error('No user data returned from signup');
      }

      // Wait a moment for auth to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create profile with retries
      const profileData = {
        id: data.user.id, // Set profile ID to auth user ID
        user_id: data.user.id,
        email,
        full_name: fullName,
        role: role as UserRole, // Ensure type casting
      };
      
      console.log('Creating profile with role:', profileData);
      console.log('Role type:', typeof profileData.role);
      console.log('Role value:', profileData.role);
      
      // Insert profile
      const { data: insertedData, error: insertError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select();
      
      console.log('Insert result:', { insertedData, insertError });

      if (insertError) {
        console.error('Error creating profile:', insertError);
        throw insertError;
      }

      // Verify profile was created
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (fetchError || !profile) {
        console.error('Error verifying profile:', fetchError);
        throw fetchError || new Error('Profile verification failed');
      }

      console.log('Profile created and verified:', profile);
      
      // Set the profile in state
      setProfile(profile);
      setCurrentRole(profile.role);
      
      return profile;
    } catch (error) {
      console.error('Error in signup process:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('Attempting to sign out...');
    // Clear local state immediately for a responsive UI
    setUser(null);
    setProfile(null);
    setIsDeveloper(false);
    setCurrentRole(null);
    setLoading(false); // Ensure loading is false after sign out attempt

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during Supabase sign out:', error);
        // Even if there's an error, the local state is already cleared.
        // We might want to re-throw or handle this error more gracefully
        // depending on desired user experience. For now, just log.
        throw error;
      }
      console.log('Supabase sign out successful.');
    } catch (error) {
      console.error('Caught error during sign out process:', error);
      // If an error occurs, the local state is already cleared,
      // so the UI should reflect signed out.
    }
  };

  const setDeveloperMode = (mode: boolean) => {
    setIsDeveloper(mode);
    if (!mode) {
      setCurrentRole(profile?.role || null);
    }
  };



  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isDeveloper,
    setDeveloperMode,
    currentRole,
    setCurrentRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
