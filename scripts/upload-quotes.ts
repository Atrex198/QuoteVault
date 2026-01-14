import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Category mapping based on tags
const getCategoryFromTags = (tags: string[]): string => {
  const tagStr = tags.join(',').toLowerCase();
  
  if (tagStr.match(/love|relationship|heart|romance/)) return 'Love';
  if (tagStr.match(/humor|funny|comedy/)) return 'Humor';
  if (tagStr.match(/success|achiev|win|goal/)) return 'Success';
  if (tagStr.match(/wisdom|philosoph|think|truth|knowledge/)) return 'Wisdom';
  
  return 'Motivation'; // Default category (covers inspiration, life, etc.)
}

// Parse tags string (array format in CSV)
const parseTags = (tagsStr: string): string[] => {
  try {
    // Remove quotes and brackets, split by comma
    const cleaned = tagsStr.replace(/["\[\]]/g, '').trim();
    if (!cleaned) return [];
    return cleaned.split(',').map(tag => tag.trim().replace(/'/g, ''));
  } catch (error) {
    return [];
  }
}

async function clearQuotes() {
  console.log('🗑️  Clearing existing quotes...');
  
  // Step 1: Clear daily_quotes first (due to foreign key constraint)
  const { error: dailyError } = await supabase
    .from('daily_quotes')
    .delete()
    .neq('quote_id', '00000000-0000-0000-0000-000000000000');
  
  if (dailyError) {
    console.error('❌ Error clearing daily_quotes:', dailyError.message);
    throw dailyError;
  }
  console.log('✅ Daily quotes cleared');
  
  // Step 2: Clear collection_quotes (junction table)
  const { error: collectionError } = await supabase
    .from('collection_quotes')
    .delete()
    .neq('quote_id', '00000000-0000-0000-0000-000000000000');
  
  if (collectionError) {
    console.error('❌ Error clearing collection_quotes:', collectionError.message);
    throw collectionError;
  }
  console.log('✅ Collection quotes cleared');
  
  // Step 3: Clear favorites
  const { error: favError } = await supabase
    .from('favorites')
    .delete()
    .neq('quote_id', '00000000-0000-0000-0000-000000000000');
  
  if (favError) {
    console.error('❌ Error clearing favorites:', favError.message);
    throw favError;
  }
  console.log('✅ Favorites cleared');
  
  // Step 4: Finally, delete all quotes
  const { error } = await supabase
    .from('quotes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (error) {
    console.error('❌ Error clearing quotes:', error.message);
    throw error;
  }
  
  console.log('✅ All quotes cleared');
}

async function uploadQuotes(csvPath: string) {
  console.log(`📖 Reading CSV file: ${csvPath}`);
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  console.log(`📊 Found ${records.length} quotes to upload`);
  
  // Process in batches of 100
  const BATCH_SIZE = 100;
  let uploadedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    
    const quotesToInsert = batch.map((record: any) => {
      const tags = parseTags(record.tags || '');
      const category = getCategoryFromTags(tags);
      
      return {
        content: record.quote || '',
        author: record.author || 'Unknown',
        category: category,
      };
    }).filter(q => q.content && q.author); // Filter out empty quotes
    
    if (quotesToInsert.length === 0) continue;
    
    const { data, error } = await supabase
      .from('quotes')
      .insert(quotesToInsert)
      .select('id');
    
    if (error) {
      console.error(`❌ Error uploading batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
      errorCount += quotesToInsert.length;
    } else {
      uploadedCount += quotesToInsert.length;
      console.log(`✅ Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1} (${uploadedCount}/${records.length})`);
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📈 Upload Summary:');
  console.log(`✅ Successfully uploaded: ${uploadedCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${records.length}`);
}

async function main() {
  try {
    console.log('🚀 Starting Supabase quotes upload...\n');
    
    // Path to CSV file
    const csvPath = path.join(__dirname, '../archive (2)/scrapped_quotes2.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found: ${csvPath}`);
      process.exit(1);
    }
    
    // Step 1: Clear existing quotes
    await clearQuotes();
    
    console.log(''); // Empty line
    
    // Step 2: Upload new quotes
    await uploadQuotes(csvPath);
    
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
