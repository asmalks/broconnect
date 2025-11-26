-- Add file size limits and MIME type restrictions to storage buckets

-- Update avatars bucket: 2MB limit, images only
UPDATE storage.buckets 
SET 
  file_size_limit = 2097152,  -- 2MB in bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';

-- Update complaint-attachments bucket: 10MB limit, images and PDFs
UPDATE storage.buckets 
SET 
  file_size_limit = 10485760,  -- 10MB in bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
WHERE id = 'complaint-attachments';

-- Update chat-attachments bucket: 10MB limit, images and PDFs
UPDATE storage.buckets 
SET 
  file_size_limit = 10485760,  -- 10MB in bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
WHERE id = 'chat-attachments';