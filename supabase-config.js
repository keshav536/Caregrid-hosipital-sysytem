/**
 * supabase-config.js
 * CareGrid HMS — Supabase Initialization
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://supabase.com/
 * 2. Select your project
 * 3. Go to Project Settings > API
 * 4. Copy the Project URL and Anon public key and paste them below
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ============================================================
// REPLACE THESE VALUES WITH YOUR SUPABASE PROJECT CREDENTIALS
// ============================================================
const supabaseUrl     = "https://rvitwwwhgtqcfvmczhme.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2aXR3d3doZ3RxY2Z2bWN6aG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDY4MzMsImV4cCI6MjA5ODQ4MjgzM30.sb2YYOMlvR4bnFbdXimy2iF5USCO18Jd8f2W7VFOj9E";
// ============================================================

// Initialize the Supabase client directly (same pattern as Firebase)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };
