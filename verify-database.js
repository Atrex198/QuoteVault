// Verify Supabase database quotes import
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyQuotesImport() {
  console.log('🔍 Verifying Supabase quotes import...\n');

  // Check if Supabase is configured
  if (!supabase) {
    console.error('❌ Supabase client not configured');
    return;
  }

  try {
    // 1. Get total count of quotes
    const { count: totalCount, error: countError } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error fetching quote count:', countError.message);
      return;
    }

    console.log(`✅ Total quotes in database: ${totalCount}\n`);

    // 2. Get count by category
    const categories = ['Motivation', 'Wisdom', 'Love', 'Humor', 'Success'];
    console.log('📊 Distribution by category:');
    
    for (const category of categories) {
      const { count, error } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('category', category);

      if (!error) {
        console.log(`   ${category}: ${count} quotes`);
      }
    }

    // 3. Get a random sample quote from each category
    console.log('\n📝 Sample quotes:');
    for (const category of categories) {
      const { data, error } = await supabase
        .from('quotes')
        .select('content, author, category')
        .eq('category', category)
        .limit(1);

      if (!error && data && data.length > 0) {
        const quote = data[0];
        console.log(`\n   [${quote.category}]`);
        console.log(`   "${quote.content.substring(0, 80)}..."`);
        console.log(`   - ${quote.author}`);
      }
    }

    // 4. Test daily quote function
    console.log('\n🌅 Testing daily quote...');
    const { data: dailyQuote, error: dailyError } = await supabase
      .from('daily_quotes')
      .select(`
        date,
        quote_id,
        quotes (
          content,
          author,
          category
        )
      `)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    if (dailyError) {
      console.log('   ⚠️  No daily quote set yet. Run: SELECT rotate_daily_quote();');
    } else if (dailyQuote) {
      console.log('   ✅ Daily quote is set!');
    }

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run verification
verifyQuotesImport();
