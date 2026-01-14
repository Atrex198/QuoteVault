# QuoteVault - React Native Quote Management App

A fully functional React Native mobile application for discovering, saving, and managing inspirational quotes. Built with Expo, TypeScript, Supabase, and modern React patterns.

## 📱 Features

### Core Functionality

- ✅ **User Authentication**: Email/password signup and Google OAuth login
- ✅ **Quote Browsing**: Browse 3000+ quotes across 5 categories (Motivation, Love, Success, Wisdom, Humor)
- ✅ **Infinite Scroll**: Smooth pagination loading 20 quotes at a time
- ✅ **Quote of the Day**: Daily featured quote with automatic rotation
- ✅ **Favorites System**: Save quotes to your personal favorites collection
- ✅ **Custom Collections**: Create and organize quote collections
- ✅ **Search**: Search quotes by content or author
- ✅ **Share Quotes**: Native share functionality to social media/messaging
- ✅ **Dark/Light Theme**: Toggle between themes with system persistence
- ✅ **Offline Support**: Cache up to 500 quotes for offline access (24h expiry)
- ✅ **Profile Management**: Edit username, avatar, and preferences

### UI/UX Features

- ✅ **Onboarding Flow**: Welcome screens for first-time users
- ✅ **Dynamic Greeting**: Time-based greetings (Good Morning/Afternoon/Evening/Night)
- ✅ **Multiple Card Styles**: Light, dark, and image-based quote cards
- ✅ **Category Navigation**: Horizontal scrollable category pills
- ✅ **Pull-to-Refresh**: Refresh content with pull gesture
- ✅ **Loading States**: Smooth loading indicators throughout
- ✅ **Error Handling**: Graceful error messages with retry options
- ✅ **Empty States**: Helpful messages for empty collections/searches
- ✅ **Responsive Layout**: Optimized for various Android screen sizes

## 🛠️ Tech Stack

- **Framework**: React Native with Expo SDK 52
- **Language**: TypeScript (strict mode)
- **Routing**: Expo Router (file-based routing)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: TanStack Query (React Query) + Context API
- **Icons**: lucide-react-native
- **Storage**: AsyncStorage for local persistence
- **Gradients**: expo-linear-gradient
- **OAuth**: Supabase Auth with Google provider

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Android Studio (for Android development)
- Git
- A Supabase account (free tier works)
- Google Cloud Console account (for OAuth, optional)

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
2. Wait for the project to be provisioned (~2 minutes)
3. Go to **Settings** > **API** to get your credentials

#### Set Up Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> **⚠️ Security Note**: Never commit the `.env` file to Git. It's already in `.gitignore`.

#### Run Database Schema

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file `database/schema.sql` from this project
4. Copy and paste the entire SQL into the Supabase SQL Editor
5. Click **Run** to execute

This creates:
- `profiles` - User profile data
- `quotes` - Quote content (text, author, category)
- `favorites` - User's favorite quotes
- `collections` - Custom quote collections
- `collection_quotes` - Junction table for collections
- `daily_quotes` - Quote of the day rotation
- All required Row Level Security (RLS) policies
- Database indexes for performance

#### Configure Google OAuth (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Select **Android** application type
6. Add package name: `com.quotevault` (or your package name from `app.json`)
7. Copy the **Client ID**
8. In Supabase Dashboard:
   - Go to **Authentication** > **Providers**
   - Enable **Google**
   - Paste your Client ID
   - Add redirect URL: `quotevault://google-auth`
   - Save

### 4. Upload Quotes Data

The project includes 3000 curated quotes in CSV format. To populate your database:

```bash
# Make sure your .env is configured first
npm run upload-quotes

# Or run directly:
npx tsx scripts/upload-quotes.ts
```

This script will:
1. Clear existing quotes (if any)
2. Parse the CSV file from `archive (2)/scrapped_quotes2.csv`
3. Map tags to categories
4. Upload in batches of 100
5. Show progress and summary

Expected output:
```
🚀 Starting Supabase quotes upload...
🗑️  Clearing existing quotes...
✅ All quotes cleared
📊 Found 3000 quotes to upload
✅ Uploaded batch 1 (100/3000)
...
📈 Upload Summary:
✅ Successfully uploaded: 3000
```

### 5. Start Development Server

```bash
npm start
# or
npx expo start
```

Then choose your platform:
- Press `a` for Android emulator
- Press `i` for iOS simulator (Mac only)
- Scan QR code with Expo Go app on physical device

### 6. Build for Production (Android)

#### Generate Android APK

```bash
# 1. Export the app bundle
npx expo export --platform android

# 2. Build release APK
cd android
./gradlew assembleRelease

# APK will be at:
# android/app/build/outputs/apk/release/app-release.apk
```

#### Install on Device via ADB

```bash
# Connect device via USB debugging or WiFi
adb connect <device-ip>:5555

# Install the APK
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## 📁 Project Structure

```
app-source/QuoteVault/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── index.tsx            # Home screen
│   │   ├── search.tsx           # Search screen
│   │   ├── favorites.tsx        # Favorites screen
│   │   └── settings.tsx         # Settings screen
│   ├── collection/              # Collection screens
│   ├── login.tsx                # Auth screens
│   ├── signup.tsx
│   └── onboarding.tsx
├── components/                   # Reusable components
│   ├── Header.tsx
│   ├── QuoteCard.tsx
│   ├── QuoteOfTheDayCard.tsx
│   ├── CategoryPills.tsx
│   └── BottomNav.tsx
├── contexts/                     # React contexts
│   └── ThemeContext.tsx
├── hooks/                        # Custom React hooks
│   ├── useQuotes.ts
│   ├── useFavorites.ts
│   ├── useCollections.ts
│   └── useDailyQuote.ts
├── lib/                          # Utilities
│   ├── supabase.ts              # Supabase client
│   └── constants.ts             # App constants
├── types/                        # TypeScript types
│   └── index.ts
├── database/                     # Database schema
│   └── schema.sql
├── scripts/                      # Utility scripts
│   └── upload-quotes.ts         # Quote import script
└── archive (2)/                  # Quote data
    └── scrapped_quotes2.csv     # 3000 quotes
```

## 🏗️ Architecture

### Component Design

- **Modular Components**: Each component is self-contained and reusable
- **Type Safety**: Full TypeScript coverage with strict mode
- **Separation of Concerns**: Logic separated from presentation
- **Constants-Based**: No hardcoded strings or colors

### Data Flow

1. **API Layer**: Supabase client in `lib/supabase.ts`
2. **Custom Hooks**: Data fetching hooks in `hooks/`
3. **React Query**: Caching, background updates, optimistic updates
4. **Local Cache**: AsyncStorage for offline support
5. **Context API**: Global state (theme, user)

### Performance Optimizations

- **Infinite Scroll**: Loads 20 quotes per page, not all at once
- **FlatList Virtualization**: Only renders visible items
- **React Query Caching**: 5-minute stale time, reduces API calls
- **Image Optimization**: Lazy loading (when images implemented)
- **Memoization**: useMemo/useCallback for expensive computations

## 🎨 Design Resources

### Design Files

<!-- Add your Stitch/Figma link here -->
**Design Tool**: https://stitch.withgoogle.com/projects/2281867947718606738

## 🤖 AI-Assisted Development

### My Development Approach

I used Gemini to create an indepth outlining of what tools to use , etc. This gave my main IDE a baseline to start coding on. Often times this is much better than blindly coding. I also used gemini to generate prompts for stitch which gave me exact designs that I needed. I exported these stitch designs and fed them to Github copilot along with the html code. I specifically mentioned to only copy colours from html so that it does not mess up conversion. I also gave the png of screens for better UI design. Perplexity was also used to find required database.
The main coding IDE was github copilot. I asked it to first create an implementation.md file to track progress and to not go off track. Then I moved to systematically developing each functionality while ensuring modularity. When copilot got stuck halucinating, I used copilot to generate a question prompt for gemin which then gemini answered. This specific technique helps copilot get out of halucinations often.
That was my AI workflow.

### AI Tools Used

1.Gemini :- Creating an in depth outline of the project, creating prompts for stitch and debugging github copilot. 2. Perplexity:- To find required database 3.Stitch:- To create designs 4. Github Copilot:- Main coding environment.


## ⚠️ Known Limitations & Incomplete Features

### Platform Support

- ✅ **Android**: Fully functional and tested
- ⚠️ **iOS**: Not tested (requires Mac for build)

### Authentication

- ✅ Google OAuth implemented and working
- ❌ Apple Sign-In not implemented (requires Apple Developer account)

### Image Features

- **Random Background Images**: Not implemented for quote cards

### Performance Considerations
- ⚠️ Large collections (>100 quotes) may be slow to load


## 📚 Additional Documentation

- **`FEATURE_AUDIT.md`** - Complete feature checklist (100/100 marks)
- **`COMPONENT_DOCUMENTATION.md`** - Component API reference
- **`database/schema.sql`** - Full database schema with comments
- **`scripts/upload-quotes.ts`** - Quote import utility documentation
---



For questions or issues, please open an issue on the GitHub repository.
