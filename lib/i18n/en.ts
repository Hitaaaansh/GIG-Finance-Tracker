// ─── i18n — English Translations ─────────────────────────────────────────────

export const en = {
  // App
  appName: "GigTrack",
  tagline: "Track every rupee you earn",

  // Nav
  nav: {
    home: "Home",
    add: "Add",
    analytics: "Analytics",
    profile: "Profile",
  },

  // Auth
  auth: {
    login: "Sign In",
    register: "Create Account",
    logout: "Sign Out",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    forgotPassword: "Forgot password?",
    resetPassword: "Reset Password",
    resetPasswordSent: "If that email exists, a reset link has been sent.",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    signUp: "Sign up",
    signIn: "Sign in",
    errors: {
      emailRequired: "Email is required.",
      emailInvalid: "Enter a valid email address.",
      passwordRequired: "Password is required.",
      passwordMin: "Password must be at least 8 characters.",
      passwordMismatch: "Passwords do not match.",
      loginFailed: "Invalid email or password.",
      registerFailed: "Could not create account. Please try again.",
    },
  },

  // Onboarding
  onboarding: {
    welcome: "Welcome to GigTrack",
    welcomeSub: "Let's set up your account in a few steps.",
    step1: { title: "Your Name", label: "Display name", placeholder: "e.g. Ramesh Kumar" },
    step2: { title: "Language", label: "Choose your preferred language" },
    step3: { title: "Your Platforms", label: "Which platforms do you work on?" },
    step4: {
      title: "Monthly Target",
      label: "Net income target (₹)",
      placeholder: "e.g. 25000",
      hint: "This is your take-home target after expenses.",
    },
    step5: {
      title: "Working Days",
      label: "Which days do you usually work?",
      hint: "Select at least one day.",
    },
    step6: {
      title: "Optional Details",
      cityLabel: "City (optional)",
      cityPlaceholder: "e.g. Mumbai",
      vehicleLabel: "Vehicle type (optional)",
    },
    next: "Next",
    back: "Back",
    finish: "Start Tracking",
    errors: {
      nameRequired: "Name is required.",
      targetRequired: "Enter a valid target amount.",
      weekdayRequired: "Select at least one working day.",
      platformRequired: "Select at least one platform.",
    },
  },

  // Dashboard
  dashboard: {
    title: "Dashboard",
    today: "Today",
    monthProgress: "Month Progress",
    target: "Target",
    gross: "Gross Earnings",
    expenses: "Expenses",
    net: "Net Earnings",
    remaining: "Remaining",
    requiredPerDay: "Required / workday",
    remainingWorkdays: "Working days left",
    status: {
      on_track: "On Track",
      behind: "Behind Target",
      significantly_behind: "Significantly Behind",
      target_reached: "Target Reached! 🎉",
      no_data: "No data yet",
    },
    statusHint: {
      on_track: "You're keeping pace with your schedule.",
      behind: "You're slightly behind your planned schedule.",
      significantly_behind: "You're significantly behind. Consider adding more shifts.",
      target_reached: "You've met your monthly target. Great work!",
      no_data: "Start adding earnings to see your progress.",
    },
    noWorkdaysLeft: "No planned workdays left this month — consider adjusting your schedule or target.",
    emptyState: {
      title: "Nothing tracked yet",
      body: "Add your first earning or expense to see your financial picture.",
      cta: "Add Entry",
    },
    expectedProgress: "Expected by today",
    actualProgress: "Actual so far",
    targetChangedAt: "Target updated",
  },

  // Add Entry
  entry: {
    title: "Add Entries",
    earningTab: "Earning",
    expenseTab: "Expense",
    amount: "Amount (₹)",
    platform: "Platform",
    date: "Date",
    expenseLabel: "Where did you spend?",
    customLabel: "Custom label",
    notes: "Notes (optional)",
    addRow: "+ Add another row",
    saveAll: "Save All",
    saving: "Saving…",
    saved: "Saved!",
    source: {
      manual: "Manual",
      mock_api: "Synced",
    },
    errors: {
      amountRequired: "Enter an amount.",
      amountPositive: "Amount must be greater than 0.",
      platformRequired: "Select a platform.",
      labelRequired: "Select or enter a label.",
      dateRequired: "Select a date.",
      batchFailed: "Some entries could not be saved. Please check and retry.",
    },
    deleteConfirm: "Delete this entry?",
    editTitle: "Edit Entry",
  },

  // Analytics
  analytics: {
    title: "Analytics",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    earningsVsExpenses: "Earnings vs Expenses",
    netEarnings: "Net Earnings",
    platformBreakdown: "Platform Breakdown",
    contribution: "Contribution",
    activities: "Activities",
    noData: "Not enough data yet",
    noDataHint: "Add more entries to see trends and comparisons.",
    avgDaily: "Avg. Daily Earnings",
    totalGross: "Total Gross",
    totalExpense: "Total Expenses",
    totalNet: "Total Net",
  },

  // Recommendations
  recommendations: {
    title: "Suggestions",
    basis: "Based on",
    noData: "Add at least a week of data to see personalized suggestions.",
  },

  // Profile
  profile: {
    title: "Profile",
    editName: "Display Name",
    language: "Language",
    platforms: "Platforms",
    target: "Monthly Target (₹)",
    workdays: "Working Days",
    city: "City",
    vehicle: "Vehicle Type",
    emailNotifs: "Email Notifications",
    morningEmail: "Morning summary email",
    eveningEmail: "Evening reminder email",
    syncPlatforms: "Sync Platform Data",
    syncing: "Syncing…",
    lastSynced: "Last synced",
    loadDemoData: "Load Demo Data",
    demoDataLoaded: "Demo data loaded!",
    saveChanges: "Save Changes",
    saved: "Changes saved.",
    targetHistory: "Target History",
    vehicles: {
      bike: "Bike",
      auto: "Auto",
      car: "Car",
      cycle: "Cycle",
      other: "Other",
    },
  },

  // Common
  common: {
    loading: "Loading…",
    error: "Something went wrong. Please try again.",
    retry: "Retry",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    or: "or",
    of: "of",
    na: "N/A",
    perDay: "/ day",
    thisMonth: "This month",
    lastUpdated: "Last updated",
  },
} as const;

type DeepString<T> = {
  [K in keyof T]: T[K] extends object ? DeepString<T[K]> : string;
};

export type TranslationKey = DeepString<typeof en>;
