import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  console.log('📊 Fetching sample quote from Supabase...\n');
  
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('✅ Sample quote structure:');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('\n📋 Column names:');
    console.log(Object.keys(data[0]).join(', '));
  } else {
    console.log('⚠️  No quotes found in database');
  }
}

checkSchema();
