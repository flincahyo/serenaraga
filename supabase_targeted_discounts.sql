-- 1. Tambahkan kolom target ke tabel discounts jika belum ada
ALTER TABLE public.discounts
ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'global',
ADD COLUMN IF NOT EXISTS target_service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS target_category_id text REFERENCES public.service_categories(id) ON DELETE SET NULL;

-- 2. Tambahkan CHECK constraint pada target_type
ALTER TABLE public.discounts
DROP CONSTRAINT IF EXISTS check_target_type,
ADD CONSTRAINT check_target_type CHECK (target_type IN ('global', 'service', 'category'));
