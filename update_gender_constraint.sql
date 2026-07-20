-- ==============================================================
-- SQL Migration: Update patients_gender_check Constraint
-- Description: Safely updates the check constraint on the gender column
--              of the patients table to be case-insensitive (LOWER),
--              preventing casing mismatches without losing any data.
-- Run this in the SQL Editor on your Supabase Dashboard:
-- https://supabase.com/dashboard/project/rvitwwwhgtqcfvmczhme/sql
-- ==============================================================

-- 1. Safely drop the existing constraint (if it exists)
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_gender_check;

-- 2. Add the updated case-insensitive constraint
ALTER TABLE patients ADD CONSTRAINT patients_gender_check CHECK (LOWER(gender) IN ('male', 'female', 'other'));

-- 3. Verify constraint is applied successfully
COMMENT ON CONSTRAINT patients_gender_check ON patients IS 'Ensures gender is case-insensitively one of male, female, or other';
