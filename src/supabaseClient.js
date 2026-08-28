import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://swlekfzgwxhtwdmzadti.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3bGVrZnpnd3hodHdkbXphZHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MTQ3NjksImV4cCI6MjEwMzQ5MDc2OX0.JhZwthBsuXKGVtFFCgiKKmRm-ZEN_2bfNRVfP6WewvQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
