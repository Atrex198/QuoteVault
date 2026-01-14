import csv
import json
import random

# Read the CSV file
quotes_data = []

with open('archive (2)/scrapped_quotes2.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        quotes_data.append({
            'quote': row['quote'],
            'author': row['author'],
            'tags': row['tags']
        })

print(f"Total quotes loaded: {len(quotes_data)}")

# Category mapping based on tags
CATEGORY_KEYWORDS = {
    'Motivation': [
        'inspirational', 'motivation', 'success', 'goals', 'determination',
        'courage', 'strength', 'perseverance', 'change', 'action'
    ],
    'Wisdom': [
        'wisdom', 'philosophy', 'knowledge', 'truth', 'learning',
        'education', 'experience', 'understanding', 'life', 'time'
    ],
    'Love': [
        'love', 'romance', 'relationships', 'heart', 'marriage',
        'dating', 'passion', 'soulmate', 'romance', 'affection'
    ],
    'Humor': [
        'humor', 'funny', 'comedy', 'wit', 'sarcasm', 'jokes'
    ],
    'Success': [
        'success', 'business', 'entrepreneurship', 'achievement',
        'ambition', 'work', 'career', 'money', 'wealth'
    ]
}

def categorize_quote(tags_str):
    """Categorize a quote based on its tags"""
    try:
        tags = json.loads(tags_str.replace("'", '"'))
        tags_lower = [tag.lower() for tag in tags]
        
        # Score each category
        category_scores = {}
        for category, keywords in CATEGORY_KEYWORDS.items():
            score = sum(1 for keyword in keywords if any(keyword in tag for tag in tags_lower))
            if score > 0:
                category_scores[category] = score
        
        # Return category with highest score, or default to Wisdom
        if category_scores:
            return max(category_scores, key=category_scores.get)
        return 'Wisdom'  # Default category
    except:
        return 'Wisdom'

# Categorize all quotes
categorized_quotes = {}
for category in CATEGORY_KEYWORDS.keys():
    categorized_quotes[category] = []

for quote_data in quotes_data:
    category = categorize_quote(quote_data['tags'])
    quote_data['category'] = category
    categorized_quotes[category].append(quote_data)

# Print statistics
print("\nCategory Distribution:")
for category, quotes in categorized_quotes.items():
    print(f"{category}: {len(quotes)} quotes")

# Generate SQL INSERT statements
card_styles = ['light', 'dark', 'image']

with open('database/quotes_import.sql', 'w', encoding='utf-8') as f:
    f.write("-- Auto-generated quotes from CSV\n")
    f.write("-- Total quotes: {}\n\n".format(len(quotes_data)))
    
    # Limit to 500 quotes for reasonable database size
    selected_quotes = []
    quotes_per_category = 100
    
    for category, quotes in categorized_quotes.items():
        selected = quotes[:quotes_per_category] if len(quotes) > quotes_per_category else quotes
        selected_quotes.extend(selected)
    
    f.write(f"-- Inserting {len(selected_quotes)} quotes\n\n")
    f.write("INSERT INTO public.quotes (content, author, category) VALUES\n")
    
    for i, quote in enumerate(selected_quotes):
        # Clean the quote text
        quote_text = quote['quote'].replace("'", "''")  # Escape single quotes
        author = quote['author'].replace("'", "''").strip(',')  # Remove trailing commas
        category = quote['category']
        
        # Add comma except for last quote
        comma = ',' if i < len(selected_quotes) - 1 else ';'
        
        f.write(f"  ('{quote_text}', '{author}', '{category}'){comma}\n")
    
    f.write("\n-- Quotes import complete\n")

print(f"\nSQL file generated: database/quotes_import.sql")
print(f"Total quotes in SQL: {len(selected_quotes)}")
