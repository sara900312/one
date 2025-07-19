-- SQL to fix the "unrecognized configuration parameter app.current_user_id" error
-- This error occurs when PostgreSQL doesn't recognize the custom configuration parameter

-- Solution 1: Define the custom configuration parameter
-- This tells PostgreSQL that app.current_user_id is a valid custom parameter
-- Add this to your PostgreSQL configuration or run as a superuser

-- For Supabase or cloud PostgreSQL, you might need to request this from support
-- or use the alternative solutions below

-- Solution 2: Create a function to safely set the parameter
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  -- Use a more standard approach with session variables
  -- This works without needing custom configuration parameters
  PERFORM set_config('app.current_user_id', user_id, true);
EXCEPTION WHEN OTHERS THEN
  -- If setting config fails, we can use a table-based approach
  -- or simply ignore and handle in application logic
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Solution 3: Create a helper function to get current user ID safely
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  -- Try to get the configuration parameter, return null if not set
  RETURN current_setting('app.current_user_id', true);
EXCEPTION WHEN OTHERS THEN
  -- Return null if parameter doesn't exist
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Solution 4: Update any functions that use current_setting('app.current_user_id')
-- Replace direct calls with the safer helper function

-- Example: If you have RLS policies using app.current_user_id, update them:
-- OLD: current_setting('app.current_user_id')::uuid
-- NEW: COALESCE(get_current_user_id()::uuid, auth.uid())

-- Solution 5: For Supabase specifically, use auth.uid() instead
-- If this is a Supabase project, you should use auth.uid() for current user
-- Update any policies or functions to use auth.uid() instead of app.current_user_id

-- Example RLS policy fix:
-- Instead of: current_setting('app.current_user_id')::uuid = user_id
-- Use: auth.uid() = user_id

-- Solution 6: If you need to maintain app.current_user_id for compatibility:
-- Create a view or function that maps auth.uid() to app.current_user_id

CREATE OR REPLACE FUNCTION init_user_context()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the app.current_user_id to the authenticated user's ID
  IF auth.uid() IS NOT NULL THEN
    PERFORM set_config('app.current_user_id', auth.uid()::text, true);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply this trigger to tables that need user context
-- Example for a products table:
-- DROP TRIGGER IF EXISTS set_user_context_products ON products;
-- CREATE TRIGGER set_user_context_products
--   BEFORE INSERT OR UPDATE ON products
--   FOR EACH ROW EXECUTE FUNCTION init_user_context();

-- Solution 7: Quick fix for immediate resolution
-- If you just need to get the application working immediately:
-- Replace any occurrences of current_setting('app.current_user_id') with:
-- COALESCE(current_setting('app.current_user_id', true), auth.uid()::text)

-- For Supabase Edge Functions or client-side, make sure you're setting the parameter:
-- await supabase.rpc('set_current_user_id', { user_id: user.id })

-- Check if the parameter is being used in any RLS policies:
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE qual LIKE '%app.current_user_id%' OR with_check LIKE '%app.current_user_id%';

-- Check if any functions use this parameter:
SELECT proname, prosrc
FROM pg_proc 
WHERE prosrc LIKE '%app.current_user_id%';

-- Alternative: Use a session table approach
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Create function to get user from session
CREATE OR REPLACE FUNCTION get_session_user_id(session_token TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- If no session token provided, try to get from auth
  IF session_token IS NULL THEN
    RETURN auth.uid();
  END IF;
  
  -- Get user from session table
  SELECT user_id INTO user_uuid
  FROM user_sessions
  WHERE session_id = session_token
    AND expires_at > NOW();
    
  RETURN COALESCE(user_uuid, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
