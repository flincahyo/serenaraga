-- 1. Buat tabel service_categories
CREATE TABLE IF NOT EXISTS public.service_categories (
    id text PRIMARY KEY,
    label text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Aktifkan RLS dan buat Policy untuk Akses Publik (Read & Write)
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.service_categories;
CREATE POLICY "Allow public read access" ON public.service_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write access" ON public.service_categories;
CREATE POLICY "Allow public write access" ON public.service_categories FOR ALL USING (true);

-- 2. Masukkan data kategori awal bawaan
INSERT INTO public.service_categories (id, label, sort_order) VALUES
('packages', 'Massage Packages', 1),
('services', 'Massage Services', 2),
('reflexology', 'Refleksi Service', 3),
('addons', 'Add-On Service', 4),
('split_items', 'Internal Split Item', 5)
ON CONFLICT (id) DO NOTHING;

-- 3. Migrasi/sinkronisasi jika ada data kategori custom yang terlanjur terinput sebelumnya
INSERT INTO public.service_categories (id, label, sort_order)
SELECT DISTINCT category, category_label, 99
FROM public.services
WHERE category NOT IN (SELECT id FROM public.service_categories)
ON CONFLICT (id) DO NOTHING;

-- 4. Tambahkan Foreign Key Constraint ke tabel services
ALTER TABLE public.services
DROP CONSTRAINT IF EXISTS fk_services_category,
ADD CONSTRAINT fk_services_category
FOREIGN KEY (category) REFERENCES public.service_categories(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;
