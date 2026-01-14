import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
  console.log('🧪 Testing insert to find correct column names...\n');
  
  // Try with minimal fields
  const testQuote = {
    quote: 'Test quote',
    author: 'Test Author',
    category: 'Inspirational',
  };
  
  console.log('Trying insert with:', testQuote);
  const { data, error } = await supabase
    .from('quotes')
    .insert(testQuote)
    .select();
  
  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\nℹ️  This tells us the expected column names');
  } else {
    console.log('✅ Success! Inserted quote:');
    console.log(JSON.stringify(data, null, 2));
    
    // Clean up test quote
    if (data && data.length > 0) {
      await supabase.from('quotes').delete().eq('id', data[0].id);
      console.log('\n🧹 Cleaned up test quote');
    }
  }
}

testInsert();
