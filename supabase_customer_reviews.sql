-- ==========================================================
-- Tabel: customer_reviews (Ulasan & Rating Invoice Online)
-- SerenaRaga Home Spa & Massage
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  invoice_number TEXT,
  customer_name TEXT NOT NULL DEFAULT 'Pelanggan',
  customer_phone TEXT,
  service_name TEXT,
  therapist_id UUID REFERENCES public.therapists(id) ON DELETE SET NULL,
  therapist_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[] DEFAULT '{}',
  note TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index untuk performa query cepat
CREATE INDEX IF NOT EXISTS idx_customer_reviews_booking_id ON public.customer_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_therapist_id ON public.customer_reviews(therapist_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_rating ON public.customer_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_created_at ON public.customer_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

-- Policy 1: Publik / Customer bisa insert ulasan mereka sendiri
CREATE POLICY "Public insert reviews"
  ON public.customer_reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy 2: Publik bisa membaca ulasan featured / umum
CREATE POLICY "Public read reviews"
  ON public.customer_reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy 3: Authenticated (Admin/Kasir) bisa kelola update & delete
CREATE POLICY "Admin update reviews"
  ON public.customer_reviews
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admin delete reviews"
  ON public.customer_reviews
  FOR DELETE
  TO authenticated
  USING (true);
