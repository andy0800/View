import { supabase } from './supabase';

/**
 * Calls a Supabase Edge Function with the current user's JWT automatically attached.
 * This is the single, canonical way to call Edge Functions across the entire app.
 */
export async function callEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, any>
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated. Please log in again.');

  const response = await fetch(
    `https://mlhcempjoujjpeadtttv.supabase.co/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGNlbXBqb3VqanBlYWR0dHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjUwOTAsImV4cCI6MjA5MjgwMTA5MH0.yH9GHCqEmZQXsXF-64CNm0y0Tv5vFBo8Y5hUQNp8BJU',
      },
      body: JSON.stringify(body),
    }
  );

  const json = await response.json();

  if (!response.ok || json.error) {
    throw new Error(json.error || `Edge Function "${functionName}" failed with status ${response.status}`);
  }

  return json as T;
}
