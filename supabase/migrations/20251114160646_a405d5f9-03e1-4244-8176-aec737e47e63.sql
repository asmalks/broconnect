-- Create centers table
CREATE TABLE IF NOT EXISTS public.centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;

-- Admins can manage centers
CREATE POLICY "Admins can manage centers"
ON public.centers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view centers
CREATE POLICY "Everyone can view centers"
ON public.centers
FOR SELECT
USING (true);