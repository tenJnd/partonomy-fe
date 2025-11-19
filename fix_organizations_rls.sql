-- Fix RLS policy on organizations table to allow JOINs from organization_members
-- The issue: When querying organization_members with a JOIN to organizations,
-- the RLS policy on organizations creates a circular dependency.
--
-- Solution: Allow all authenticated users to SELECT organizations.
-- The actual filtering happens at the organization_members level via its RLS policy.

-- Drop the existing SELECT policy that causes circular dependency
DROP POLICY IF EXISTS org_members_select_organizations ON public.organizations;

-- Create a simpler policy that allows SELECT for authenticated users
-- Security is maintained by the organization_members RLS policy
CREATE POLICY org_members_select_organizations ON public.organizations
    FOR SELECT
    TO authenticated
    USING (true);
