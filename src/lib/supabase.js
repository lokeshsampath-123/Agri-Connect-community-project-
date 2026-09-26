import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err.message);
  }
} else {
  console.warn('Supabase env credentials missing or invalid. Using safe local database fallback.');
}

// Fallback dummy chainable query object if client failed to initialize
const createDummyChain = () => {
  const dummyObj = {
    select: () => dummyObj,
    insert: () => dummyObj,
    update: () => dummyObj,
    delete: () => dummyObj,
    eq: () => dummyObj,
    order: () => dummyObj,
    limit: () => dummyObj,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve) => resolve({ data: [], error: null })
  };
  return dummyObj;
};

export const supabase = client || {
  from: () => createDummyChain(),
  rpc: () => Promise.resolve({ data: null, error: null })
};

