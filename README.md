# GigTrack — Personal Finance Tracker for Gig Economy Workers 🛵 📊

A bilingual (English & हिन्दी), mobile-first financial management and target-tracking web application designed for gig workers in India (Swiggy, Zomato, Uber, Ola, Rapido, Blinkit, Zepto, Porter).

GigTrack consolidates fragmented daily earnings, tracks vehicle and operational expenses, calculates real-time net take-home pay, and computes dynamic daily earnings targets required to reach monthly financial goals based on planned working days.

---

## 🌟 Key Features

### 1. 🎯 Dynamic Target Engine
- **Net Earnings Calculation**: Automatically calculates `Net = Gross Earnings − Expenses`.
- **Remaining Target**: Dynamically computes `max(0, Monthly Target − Month-to-Date Net)`.
- **Required Daily Average**: Divides remaining target by the user's future planned working days through month-end, rounded up to whole rupees.
- **Progress Status Badges**:
  - 🟢 **On Track** (actual progress $\ge$ 90% of expected)
  - 🟡 **Behind Target** (70% to < 90% of expected)
  - 🔴 **Significantly Behind** (< 70% of expected)
  - 🏆 **Target Reached!**

### 2. 📝 Multi-Row Batch Entry Form
- Add multiple earnings and expenses in a single session.
- **Earnings**: Select platform (Uber, Swiggy, Zomato, etc.), date, and amount.
- **Expenses**: Quick-select category chips (*Fuel*, *Food*, *Vehicle Maintenance*, *Mobile/Data*) or type custom expense labels.
- Preserves form state on validation errors and provides atomic batch saving.

### 3. 📈 Interactive Analytics & Breakdown
- Time-range filters: **This Month**, **Last 7 Days**, **Last 30 Days**.
- **Trends Chart**: Daily bar chart comparing Gross Earnings vs. Expenses.
- **Platform Breakdown**: Visual contribution percentage per app with activity counts.
- **Deterministic Recommendations**: Transparent, rule-based financial insights (e.g., high expense ratio warnings when expenses exceed 30% of earnings).

### 4. 🌐 Full Bilingual Localization (English & हिन्दी)
- Instant language toggle without losing in-progress form inputs.
- Styled with fonts optimized for Hindi typography and Indian currency formatting (`₹`).

### 5. 🔄 Platform Sync & Demo Data
- **Mock Adapters**: Pre-configured mock data generators for 8 platforms with idempotent record deduplication.
- **One-Click Demo Data**: Populates 20 days of realistic historical entries for immediate testing.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom design tokens
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Database & Auth**: [Supabase](https://supabase.com/) with Row-Level Security (RLS) policies
- **Fallback Data Layer**: `LocalDataService` (persisted in browser storage for instant zero-dependency local operation)

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- `npm` or `pnpm`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/finance-tracker.git
   cd finance-tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *(Note: The app will automatically fall back to its internal local data store if Supabase credentials are not provided.)*

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Tests

Run the built-in unit test suite covering target calculations, currency conversions, mock adapters, and recommendation rules:

```bash
node tests/run-tests.mjs
```

Build the production bundle:
```bash
npm run build
```

---

## 🔒 Security & Privacy

- All sensitive `.env*` configuration and credential files are strictly ignored via `.gitignore`.
- Row-Level Security (RLS) is enabled on all database tables in Supabase, restricting access exclusively to the authenticated user.
- Financial figures are stored as integer paise (`BIGINT`) to prevent floating-point rounding errors.

---

## 📄 License
MIT
