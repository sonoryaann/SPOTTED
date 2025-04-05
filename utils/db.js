import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL, // URL di Supabase
  process.env.REACT_APP_SUPABASE_ANON_KEY // La chiave anonima
);

export default supabase;
