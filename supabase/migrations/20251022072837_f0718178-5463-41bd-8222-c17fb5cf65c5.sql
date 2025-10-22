-- Add admin access policy to user_subscriptions table
-- This allows admins to view all subscriptions in the admin dashboard

CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);