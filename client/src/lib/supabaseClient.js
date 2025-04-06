import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dfdlkyhsksztrdftmyot.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmZGxreWhza3N6dHJkZnRteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MTMzNzksImV4cCI6MjA1ODA4OTM3OX0.EXf-QMs_hSCoQKLezz1NFPk_'
);

export default supabase;
