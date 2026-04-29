import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mlhcempjoujjpeadtttv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGNlbXBqb3VqanBlYWR0dHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjUwOTAsImV4cCI6MjA5MjgwMTA5MH0.yH9GHCqEmZQXsXF-64CNm0y0Tv5vFBo8Y5hUQNp8BJU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  const email = '96555555555@viewapp.com';
  const password = 'ViewApp123!';
  const phone = '+96555555555';

  console.log('1. Signing up...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  
  if (signUpError) {
    console.error('Signup Error:', signUpError);
    return;
  }

  const authUser = signUpData.user;
  console.log('User signed up:', authUser?.id);
  console.log('Session present?', !!signUpData.session);

  console.log('2. Inserting profile...');
  const { data: profileData, error: profileError } = await supabase.from('users').upsert({
    id: authUser?.id,
    role: 'viewer',
    status: 'active',
    full_name: 'Test Terminal User',
    username: 'term_user',
    phone_number: phone,
    civil_id_number: '123456789012'
  }, { onConflict: 'id' });

  if (profileError) {
    console.error('Profile Upsert Error:', profileError);
  } else {
    console.log('Profile inserted successfully!');
  }
}

testSignup();
