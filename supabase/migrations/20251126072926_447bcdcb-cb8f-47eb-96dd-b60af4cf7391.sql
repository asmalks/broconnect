-- Add missing RLS policies for user_roles table to allow admin role management

-- Allow admins to update user roles
CREATE POLICY "Admins can update user roles" ON public.user_roles
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to assign new roles
CREATE POLICY "Admins can assign user roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete user roles
CREATE POLICY "Admins can delete user roles" ON public.user_roles
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));