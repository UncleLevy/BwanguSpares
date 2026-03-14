import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ],
  server: {
    // Allow this exact host (most precise/safe option)
    allowedHosts: ['ta-01kkq27vv33h30bwy0e2dvp24j-5173-yutqhx4ndj9jsuw2lntqcpmfz.w.modal.host'],
    
    // OR — if the subdomain changes frequently (common on Modal), allow the entire domain:
    // allowedHosts: ['.w.modal.host'],   // the leading dot allows all subdomains
    
    // OR — least restrictive (convenient for dev, but less secure):
    // allowedHosts: true,
  },
});