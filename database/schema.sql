-- QuoteVault Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  author_title TEXT,
  category TEXT NOT NULL,
  tags TEXT[],
  background_image TEXT,
  card_style TEXT CHECK (card_style IN ('light', 'dark', 'image')) DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policy for quotes (readable by everyone)
CREATE POLICY "Quotes are viewable by everyone" ON quotes
  FOR SELECT USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quotes_category ON quotes(category);
CREATE INDEX IF NOT EXISTS idx_quotes_author ON quotes(author);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quote_id)
);

-- Enable Row Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policies for favorites
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_quote_id ON favorites(quote_id);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Policies for collections
CREATE POLICY "Users can view their own collections" ON collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for collections
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);

-- Collection quotes junction table
CREATE TABLE IF NOT EXISTS collection_quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, quote_id)
);

-- Enable Row Level Security
ALTER TABLE collection_quotes ENABLE ROW LEVEL SECURITY;

-- Policies for collection_quotes
CREATE POLICY "Users can view quotes in their collections" ON collection_quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_quotes.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add quotes to their collections" ON collection_quotes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_quotes.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove quotes from their collections" ON collection_quotes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_quotes.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

-- Daily quotes table
CREATE TABLE IF NOT EXISTS daily_quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  display_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;

-- Policy for daily_quotes (readable by everyone)
CREATE POLICY "Daily quotes are viewable by everyone" ON daily_quotes
  FOR SELECT USING (true);

-- Create index for daily_quotes
CREATE INDEX IF NOT EXISTS idx_daily_quotes_display_date ON daily_quotes(display_date DESC);

-- Function to get quote of the day
CREATE OR REPLACE FUNCTION get_quote_of_the_day()
RETURNS TABLE (
  id UUID,
  text TEXT,
  author TEXT,
  author_title TEXT,
  category TEXT
) AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  daily_quote_id UUID;
BEGIN
  -- Check if there's already a quote for today
  SELECT quote_id INTO daily_quote_id
  FROM daily_quotes
  WHERE display_date = today_date;
  
  -- If no quote for today, select a random one and insert it
  IF daily_quote_id IS NULL THEN
    SELECT quotes.id INTO daily_quote_id
    FROM quotes
    ORDER BY RANDOM()
    LIMIT 1;
    
    INSERT INTO daily_quotes (quote_id, display_date)
    VALUES (daily_quote_id, today_date);
  END IF;
  
  -- Return the quote
  RETURN QUERY
  SELECT 
    quotes.id,
    quotes.text,
    quotes.author,
    quotes.author_title,
    quotes.category
  FROM quotes
  WHERE quotes.id = daily_quote_id;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for quotes (100+ quotes across categories)
INSERT INTO quotes (text, author, author_title, category, card_style) VALUES
  -- Motivation (20 quotes)
  ('The only way to do great work is to love what you do.', 'Steve Jobs', 'Co-founder of Apple', 'Motivation', 'light'),
  ('Believe you can and you''re halfway there.', 'Theodore Roosevelt', '26th President of USA', 'Motivation', 'dark'),
  ('The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt', 'Former First Lady', 'Motivation', 'image'),
  ('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', 'Prime Minister', 'Motivation', 'light'),
  ('Don''t watch the clock; do what it does. Keep going.', 'Sam Levenson', 'Humorist', 'Motivation', 'dark'),
  ('The harder you work for something, the greater you''ll feel when you achieve it.', 'Anonymous', '', 'Motivation', 'light'),
  ('Dream bigger. Do bigger.', 'Anonymous', '', 'Motivation', 'dark'),
  ('Don''t stop when you''re tired. Stop when you''re done.', 'Anonymous', '', 'Motivation', 'light'),
  ('Wake up with determination. Go to bed with satisfaction.', 'Anonymous', '', 'Motivation', 'dark'),
  ('Do something today that your future self will thank you for.', 'Sean Patrick Flanery', 'Actor', 'Motivation', 'light'),
  ('Little things make big days.', 'Anonymous', '', 'Motivation', 'dark'),
  ('It''s going to be hard, but hard does not mean impossible.', 'Anonymous', '', 'Motivation', 'light'),
  ('Don''t wait for opportunity. Create it.', 'Anonymous', '', 'Motivation', 'dark'),
  ('Sometimes we''re tested not to show our weaknesses, but to discover our strengths.', 'Anonymous', '', 'Motivation', 'light'),
  ('The key to success is to focus on goals, not obstacles.', 'Anonymous', '', 'Motivation', 'dark'),
  ('Dream it. Believe it. Build it.', 'Anonymous', '', 'Motivation', 'light'),
  ('Your limitation—it''s only your imagination.', 'Anonymous', '', 'Motivation', 'dark'),
  ('Great things never come from comfort zones.', 'Anonymous', '', 'Motivation', 'light'),
  ('Success doesn''t just find you. You have to go out and get it.', 'Anonymous', '', 'Motivation', 'dark'),
  ('The harder you work, the luckier you get.', 'Gary Player', 'Golfer', 'Motivation', 'light'),
  
  -- Wisdom (20 quotes)
  ('The only true wisdom is in knowing you know nothing.', 'Socrates', 'Philosopher', 'Wisdom', 'dark'),
  ('The journey of a thousand miles begins with one step.', 'Lao Tzu', 'Philosopher', 'Wisdom', 'light'),
  ('In the middle of difficulty lies opportunity.', 'Albert Einstein', 'Physicist', 'Wisdom', 'dark'),
  ('Life is 10% what happens to you and 90% how you react to it.', 'Charles R. Swindoll', 'Author', 'Wisdom', 'light'),
  ('The best time to plant a tree was 20 years ago. The second best time is now.', 'Chinese Proverb', '', 'Wisdom', 'dark'),
  ('An investment in knowledge pays the best interest.', 'Benjamin Franklin', 'Founding Father', 'Wisdom', 'light'),
  ('Change your thoughts and you change your world.', 'Norman Vincent Peale', 'Author', 'Wisdom', 'dark'),
  ('Yesterday is history, tomorrow is a mystery, today is a gift of God.', 'Bil Keane', 'Cartoonist', 'Wisdom', 'light'),
  ('The mind is everything. What you think you become.', 'Buddha', 'Spiritual Teacher', 'Wisdom', 'dark'),
  ('Be yourself; everyone else is already taken.', 'Oscar Wilde', 'Writer', 'Wisdom', 'light'),
  ('Two things are infinite: the universe and human stupidity.', 'Albert Einstein', 'Physicist', 'Wisdom', 'dark'),
  ('A room without books is like a body without a soul.', 'Marcus Tullius Cicero', 'Philosopher', 'Wisdom', 'light'),
  ('Be the change that you wish to see in the world.', 'Mahatma Gandhi', 'Leader', 'Wisdom', 'dark'),
  ('No one can make you feel inferior without your consent.', 'Eleanor Roosevelt', 'Former First Lady', 'Wisdom', 'light'),
  ('If you tell the truth, you don''t have to remember anything.', 'Mark Twain', 'Author', 'Wisdom', 'dark'),
  ('A friend is someone who knows all about you and still loves you.', 'Elbert Hubbard', 'Writer', 'Wisdom', 'light'),
  ('To live is the rarest thing in the world. Most people exist, that is all.', 'Oscar Wilde', 'Writer', 'Wisdom', 'dark'),
  ('It is better to be hated for what you are than to be loved for what you are not.', 'André Gide', 'Author', 'Wisdom', 'light'),
  ('We accept the love we think we deserve.', 'Stephen Chbosky', 'Author', 'Wisdom', 'dark'),
  ('Without music, life would be a mistake.', 'Friedrich Nietzsche', 'Philosopher', 'Wisdom', 'light'),
  
  -- Love (20 quotes)
  ('Love is not about how much you say I love you, but how much you prove that it''s true.', 'Anonymous', '', 'Love', 'light'),
  ('The best thing to hold onto in life is each other.', 'Audrey Hepburn', 'Actress', 'Love', 'dark'),
  ('Love is composed of a single soul inhabiting two bodies.', 'Aristotle', 'Philosopher', 'Love', 'image'),
  ('Where there is love there is life.', 'Mahatma Gandhi', 'Leader', 'Love', 'light'),
  ('You know you''re in love when you can''t fall asleep because reality is finally better than your dreams.', 'Dr. Seuss', 'Author', 'Love', 'dark'),
  ('Love recognizes no barriers.', 'Maya Angelou', 'Poet', 'Love', 'light'),
  ('The best and most beautiful things in this world cannot be seen or even heard, but must be felt with the heart.', 'Helen Keller', 'Author', 'Love', 'dark'),
  ('To love and be loved is to feel the sun from both sides.', 'David Viscott', 'Psychiatrist', 'Love', 'light'),
  ('Love is when the other person''s happiness is more important than your own.', 'H. Jackson Brown Jr.', 'Author', 'Love', 'dark'),
  ('In all the world, there is no heart for me like yours.', 'Maya Angelou', 'Poet', 'Love', 'light'),
  ('Love is not finding someone to live with; it''s finding someone you can''t live without.', 'Rafael Ortiz', '', 'Love', 'dark'),
  ('I have found the one whom my soul loves.', 'Song of Solomon 3:4', 'Bible', 'Love', 'light'),
  ('Love is friendship that has caught fire.', 'Ann Landers', 'Columnist', 'Love', 'dark'),
  ('To love is nothing. To be loved is something. But to love and be loved, that''s everything.', 'T. Tolis', '', 'Love', 'light'),
  ('Every love story is beautiful, but ours is my favorite.', 'Anonymous', '', 'Love', 'dark'),
  ('I love you not only for what you are, but for what I am when I am with you.', 'Roy Croft', 'Poet', 'Love', 'light'),
  ('You are my today and all of my tomorrows.', 'Leo Christopher', '', 'Love', 'dark'),
  ('Love is the bridge between you and everything.', 'Rumi', 'Poet', 'Love', 'light'),
  ('If I had a flower for every time I thought of you, I could walk in my garden forever.', 'Alfred Lord Tennyson', 'Poet', 'Love', 'dark'),
  ('I would rather share one lifetime with you than face all the ages of this world alone.', 'J.R.R. Tolkien', 'Author', 'Love', 'light'),
  
  -- Humor (20 quotes)
  ('I''m not superstitious, but I am a little stitious.', 'Michael Scott', 'The Office', 'Humor', 'light'),
  ('The road to success is dotted with many tempting parking spaces.', 'Will Rogers', 'Actor', 'Humor', 'dark'),
  ('I find television very educational. Every time someone turns it on, I go in the other room and read a book.', 'Groucho Marx', 'Comedian', 'Humor', 'light'),
  ('Behind every great man is a woman rolling her eyes.', 'Jim Carrey', 'Actor', 'Humor', 'dark'),
  ('Life is short. Smile while you still have teeth.', 'Anonymous', '', 'Humor', 'light'),
  ('I''m not arguing, I''m just explaining why I''m right.', 'Anonymous', '', 'Humor', 'dark'),
  ('I''m not lazy, I''m just on energy-saving mode.', 'Anonymous', '', 'Humor', 'light'),
  ('Common sense is like deodorant. The people who need it most never use it.', 'Anonymous', '', 'Humor', 'dark'),
  ('My bed is a magical place where I suddenly remember everything I forgot to do.', 'Anonymous', '', 'Humor', 'light'),
  ('I need a six-month vacation, twice a year.', 'Anonymous', '', 'Humor', 'dark'),
  ('Friday is my second favorite F word.', 'Anonymous', '', 'Humor', 'light'),
  ('Chocolate doesn''t ask silly questions. Chocolate understands.', 'Anonymous', '', 'Humor', 'dark'),
  ('I''m not clumsy. It''s just the floor hates me, the tables and chairs are bullies, and the wall gets in the way.', 'Anonymous', '', 'Humor', 'light'),
  ('I don''t need anger management. I need people to stop irritating me.', 'Anonymous', '', 'Humor', 'dark'),
  ('When nothing goes right, go left.', 'Anonymous', '', 'Humor', 'light'),
  ('I''m not weird, I''m limited edition.', 'Anonymous', '', 'Humor', 'dark'),
  ('Why do they call it rush hour when nothing moves?', 'Robin Williams', 'Actor', 'Humor', 'light'),
  ('People say nothing is impossible, but I do nothing every day.', 'A.A. Milne', 'Author', 'Humor', 'dark'),
  ('I always arrive late at the office, but I make up for it by leaving early.', 'Charles Lamb', 'Writer', 'Humor', 'light'),
  ('The difference between stupidity and genius is that genius has its limits.', 'Albert Einstein', 'Physicist', 'Humor', 'dark'),
  
  -- Success (20 quotes)
  ('Success is not the key to happiness. Happiness is the key to success.', 'Albert Schweitzer', 'Philosopher', 'Success', 'light'),
  ('Success usually comes to those who are too busy to be looking for it.', 'Henry David Thoreau', 'Philosopher', 'Success', 'dark'),
  ('The way to get started is to quit talking and begin doing.', 'Walt Disney', 'Entrepreneur', 'Success', 'image'),
  ('Don''t be afraid to give up the good to go for the great.', 'John D. Rockefeller', 'Business magnate', 'Success', 'light'),
  ('I find that the harder I work, the more luck I seem to have.', 'Thomas Jefferson', 'President', 'Success', 'dark'),
  ('Success is walking from failure to failure with no loss of enthusiasm.', 'Winston Churchill', 'Prime Minister', 'Success', 'light'),
  ('The secret of success is to do the common thing uncommonly well.', 'John D. Rockefeller Jr.', 'Philanthropist', 'Success', 'dark'),
  ('Try not to become a man of success. Rather become a man of value.', 'Albert Einstein', 'Physicist', 'Success', 'light'),
  ('Stop chasing the money and start chasing the passion.', 'Tony Hsieh', 'Entrepreneur', 'Success', 'dark'),
  ('Success is not how high you have climbed, but how you make a positive difference to the world.', 'Roy T. Bennett', 'Author', 'Success', 'light'),
  ('If you really look closely, most overnight successes took a long time.', 'Steve Jobs', 'Entrepreneur', 'Success', 'dark'),
  ('The only place where success comes before work is in the dictionary.', 'Vidal Sassoon', 'Hairstylist', 'Success', 'light'),
  ('Success is the sum of small efforts repeated day in and day out.', 'Robert Collier', 'Author', 'Success', 'dark'),
  ('Opportunities don''t happen. You create them.', 'Chris Grosser', 'Photographer', 'Success', 'light'),
  ('Success seems to be connected with action. Successful people keep moving.', 'Conrad Hilton', 'Hotelier', 'Success', 'dark'),
  ('The only limit to our realization of tomorrow will be our doubts of today.', 'Franklin D. Roosevelt', 'President', 'Success', 'light'),
  ('It is not the strongest of the species that survive, nor the most intelligent, but the one most responsive to change.', 'Charles Darwin', 'Naturalist', 'Success', 'dark'),
  ('The successful warrior is the average man, with laser-like focus.', 'Bruce Lee', 'Martial Artist', 'Success', 'light'),
  ('Success is not in what you have, but who you are.', 'Bo Bennett', 'Businessman', 'Success', 'dark'),
  ('Fall seven times and stand up eight.', 'Japanese Proverb', '', 'Success', 'light');

-- Note: Total 100 quotes inserted across 5 categories
