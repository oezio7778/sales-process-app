// Supabase Configuration
// DO NOT commit this file to public repositories with real credentials
// For production, use environment variables

const SUPABASE_URL = 'https://oxlkqamuzvixjdjkmopa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94bGtxYW11enZpeGpkamttb3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTg0MjIsImV4cCI6MjA3OTQzNDQyMn0.BTpF7j3lsrG_HlUje7Pp6bPiZ6BAm4mI3ZzgYoFNdt4';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
