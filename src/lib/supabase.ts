import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mlhcempjoujjpeadtttv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGNlbXBqb3VqanBlYWR0dHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjUwOTAsImV4cCI6MjA5MjgwMTA5MH0.yH9GHCqEmZQXsXF-64CNm0y0Tv5vFBo8Y5hUQNp8BJU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
