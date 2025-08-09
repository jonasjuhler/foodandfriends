// Environment variables for the frontend
export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:8000",

  // Google OAuth (if needed for frontend)
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",

  // App Configuration
  APP_NAME: "Food & Friends",
  APP_VERSION: "1.0.0",
} as const;

// Validate required environment variables
if (!config.API_BASE_URL) {
  console.warn("VITE_API_URL is not set, using default localhost:8000");
}
