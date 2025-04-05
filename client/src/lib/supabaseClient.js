import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,  // Usa process.env per le variabili d'ambiente in CRA
  process.env.REACT_APP_SUPABASE_KEY
);

export default supabase;
