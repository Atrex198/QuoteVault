# QuoteVault - React Native Quote Management App

A fully functional React Native mobile application for discovering, saving, and managing inspirational quotes. Built with Expo, TypeScript, Supabase, and modern React patterns.

## 🎨 Design Implementation

This React Native app implements the complete QuoteVault application based on the provided Figma/Stitch designs. The implementation strictly follows the visual design with modular, reusable components.

## 📱 Features Implemented

### ✅ Completed Features

1. **Dynamic Header**
   - Time-based greeting (Good Morning/Afternoon/Evening/Night)
   - User name display
   - Avatar with fallback to initials

2. **Quote of the Day Card**
   - Large featured quote card with cyan background
   - Quote content in serif-style font
   - Author name and title display
   - Favorite (heart) button
   - Share button with primary color
   - Three-dot menu button

3. **Category Navigation**
   - Horizontal scrollable category pills
   - 5 categories: Motivation, Wisdom, Love, Humor, Success
   - Active category highlighting with primary color
   - Smooth shadow effects

4. **Quote Grid**
   - Responsive 2-column grid layout
   - Multiple card styles:
     - Light cards (white background)
     - Dark cards (gray background)
     - Image cards (with gradient overlay)
   - Favorite indicators on each card
   - Truncated text with proper line limits

5. **Bottom Navigation**
   - 4 tabs: Home, Search, Favorites, Settings
   - Active tab indication with color change
   - Icons from lucide-react-native
   - Subtle shadow elevation

## 🏗️ Architecture & Code Quality

### Modular Component Structure

```
components/
├── Header.tsx              # Greeting header with avatar
├── QuoteOfTheDayCard.tsx  # Featured quote card
├── CategoryPills.tsx       # Category filter chips
├── QuoteCard.tsx          # Reusable quote card (3 variants)
└── BottomNav.tsx          # Bottom tab navigation
```

### Constants & Configuration

- **No hardcoded strings**: All text stored in `lib/constants.ts`
- **No hardcoded colors**: Color palette defined in constants and Tailwind config
- **Type safety**: TypeScript interfaces for all data structures
- **Consistent spacing**: Predefined spacing values in constants

### Design Tokens

```typescript
// From constants.ts
COLORS: Primary (#0df2f2), backgrounds, text colors
TYPOGRAPHY: Font sizes, weights, families
SPACING: xs (4px) to 3xl (32px)
BORDER_RADIUS: sm (8px) to full (9999px)
```

## 🎯 Design Fidelity

### Extracted from Image:

- ✅ Header layout with "Good Morning, Alex" and avatar
- ✅ Cyan "Quote of the Day" card with rounded corners
- ✅ Author name with title in primary color
- ✅ Heart and share buttons positioned correctly
- ✅ Category pills with "Motivation" highlighted in cyan
- ✅ 2-column quote grid with varied card styles
- ✅ Bottom navigation with 4 icons and active indicator
- ✅ Proper spacing, shadows, and typography

### Color Palette (from HTML reference):

```css
Primary: #0df2f2 (Cyan)
Background Light: #f5f8f8
Background Dark: #102222
Font Display: Inter
Font Serif: Merriweather (for quotes)
```

## 🛠️ Tech Stack

- **Framework**: React Native + Expo SDK 54
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **Navigation**: Expo Router (file-based routing)
- **Icons**: lucide-react-native
- **Language**: TypeScript (strict mode)
- **Gradients**: expo-linear-gradient

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Android Studio (for Android development)
- Expo CLI
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Atrex198/QuoteVault.git
cd QuoteVault/app-source/QuoteVault
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your project URL and anon key from Settings > API

#### Set Up Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### Run Database Schema

Execute the SQL schema in Supabase SQL Editor:

```bash
# The schema file is located at:
database/schema.sql
```

This creates:
- `profiles` table for user data
- `quotes` table for quote content
- `favorites` table for user favorites
- `collections` table for custom collections
- `collection_quotes` junction table
- `daily_quotes` table for quote of the day
- All required RLS policies and indexes

#### Configure Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add to Supabase: Authentication > Providers > Google
4. Add redirect URL: `quotevault://google-auth`

### 4. Upload Quotes Data (Optional)

To populate the database with quotes:

```bash
# Place your quotes CSV in archive (2) folder
npm run upload-quotes
```

### 5. Start the Development Server

```bash
npm start
# or
npx expo start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator (Mac only)
- Scan QR code with Expo Go app on physical device

### 6. Build for Production

#### Android APK

```bash
# Export the app bundle
npx expo export --platform android

# Build release APK
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

#### Install on Device via ADB

```bash
# Connect device via USB or WiFi
adb connect <device-ip>:5555

# Install APK
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## 📝 Component Usage Examples

### QuoteCard Component

```tsx
<QuoteCard
  quote={quoteData}
  variant="small"           // or "large"
  onFavoritePress={() => {}}
  onSharePress={() => {}}
  onPress={() => {}}
/>
```

Supports 3 card styles:
- `cardStyle: 'light'` - White background
- `cardStyle: 'dark'` - Gray background
- `cardStyle: 'image'` - Image with gradient overlay

### CategoryPills Component

```tsx
<CategoryPills
  categories={CATEGORIES}
  selectedCategory={selectedCategory}
  onCategoryPress={(id) => setSelectedCategory(id)}
/>
```

## 🎨 Design Principles Applied

1. **Component Reusability**: Single `QuoteCard` component handles 3 visual variants
2. **Separation of Concerns**: Data, UI, and styling are separated
3. **Type Safety**: All props typed with TypeScript interfaces
4. **Accessibility**: Semantic component names, proper touch targets
5. **Performance**: FlashList ready structure for large lists
6. **Maintainability**: Constants file for easy theme changes

## 📱 Responsive Design

- Safe area handling for notched devices
- Flexible layouts using Flexbox
- ScrollView for content overflow
- Proper touch target sizes (min 44x44)

## 🔄 State Management

Currently using React `useState` for:
- Selected category filter
- Active tab state
- Quote favorites toggle

Ready for integration with:
- TanStack Query (React Query) for server state
- Context API for global theme/user state

## 🚀 Next Steps

The foundation is ready for:
1. Supabase backend integration
2. Authentication flow
3. Real quote data fetching
4. Favorites persistence
5. Share functionality
6. Dark mode theme toggle
7. Additional screens (Search, Favorites, Settings)

## 📸 Screenshots

The implementation matches the provided mockup with:
- Exact color scheme (#0df2f2 primary color)
- Matching layout and spacing
- Same typography hierarchy
- Identical component styling

---

**Built with AI-assisted development workflow**
- Design extraction from mockup
- Component architecture planning
- Modular code generation
- Type-safe implementation
