import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mlhcempjoujjpeadtttv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGNlbXBqb3VqanBlYWR0dHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjUwOTAsImV4cCI6MjA5MjgwMTA5MH0.yH9GHCqEmZQXsXF-64CNm0y0Tv5vFBo8Y5hUQNp8BJU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignin() {
  const email = '96555555555@viewapp.com';
  const password = 'ViewApp123!';

  console.log('Trying to sign in...');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    console.error('SignIn Error:', error);
  } else {
    console.log('Session present after signin?', !!data.session);
  }
}

testSignin();
