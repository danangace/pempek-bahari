-- ============================================================
-- Phase 2 Seed Data
-- Run in Supabase SQL Editor AFTER the Phase 2 migration
-- ============================================================
-- This replaces seed-products.sql (old schema had products.price)
-- Run order: pempek_types → products → product_compositions
-- ============================================================

-- ============================================================
-- 1. Pempek Types
--    Price is per-piece (IDR). Adjust as needed.
--    Computed package prices:
--      Paket Lenjer  = 10 × 4500  = 45.000
--      Paket Telur   = 10 × 5000  = 50.000
--      Paket Adaan   = 10 × 4500  = 45.000
--      Paket Krispi  = 10 × 5000  = 50.000
--      Paket Mix     = 3×4500 + 2×5000 + 2×4500 + 3×5000 = 47.500
-- ============================================================
INSERT INTO pempek_types (name, price, status) VALUES
  ('Lenjer',  5000, 'ACTIVE'),
  ('Telur',   5500, 'ACTIVE'),
  ('Adaan',   5000, 'ACTIVE'),
  ('Krispi',  5000, 'ACTIVE'),
  -- INACTIVE = used only as a pricing unit for Ekstra Cuko.
  -- Won't appear in Mix Custom picker (usePempekTypes() filters ACTIVE only).
  ('Cuko',    15000, 'INACTIVE');

-- ============================================================
-- 2. Products (no price column — computed from compositions)
--    Update image_path values to match your storage bucket.
--    Paket Mix Custom uses is_custom_mix = true and has
--    no product_compositions rows.
-- ============================================================
INSERT INTO products (name, description, image_path, category, is_available, is_custom_mix) VALUES
  (
    'Paket Lenjer',
    'Pempek lenjer klasik berbahan ikan tenggiri segar, kenyal dan gurih. Isi 10pcs.',
    'lenjer.webp',
    'pempek',
    true,
    false
  ),
  (
    'Paket Telur',
    'Pempek telur lezat dengan isian telur ayam, disajikan bersama kuah cuko. Isi 10pcs.',
    'telur.webp',
    'pempek',
    true,
    false
  ),
  (
    'Paket Adaan',
    'Pempek adaan bulat khas Palembang, renyah di luar dan lembut di dalam. Isi 10pcs.',
    'adaan.webp',
    'pempek',
    true,
    false
  ),
  (
    'Paket Krispi',
    'Pempek goreng krispi dengan tekstur renyah yang menggugah selera. Isi 10pcs.',
    'krispi.webp',
    'pempek',
    true,
    false
  ),
  (
    'Paket Mix',
    'Kombinasi pempek pilihan: 3 Lenjer, 2 Telur, 2 Adaan, 3 Krispi dalam satu paket. Isi 10pcs.',
    'mix.webp',
    'pempek',
    true,
    false
  ),
  (
    'Paket Mix Custom',
    'Buat paket pempekmu sendiri! Pilih kombinasi 10pcs sesukamu dari berbagai jenis pempek.',
    'mix.webp',
    'pempek',
    true,
    true
  ),
  (
    'Ekstra Cuko',
    'Tambahan kuah cuko khas Palembang, asam manis pedas yang autentik.',
    'ekstra-cuko.webp',
    'pelengkap',
    true,
    false
  );

-- ============================================================
-- 3. Product Compositions
--    Uses name-based CTE to avoid hard-coding UUIDs.
--    Paket Mix Custom  → no rows (user-defined at order time)
--    Ekstra Cuko       → 1× Cuko (INACTIVE type used as pricing unit)
-- ============================================================
WITH
  t AS (SELECT id, name FROM pempek_types),
  p AS (SELECT id, name FROM products)
INSERT INTO product_compositions (product_id, pempek_type_id, quantity)

-- Paket Lenjer: 10× Lenjer
SELECT p.id, t.id, 10
  FROM p CROSS JOIN t
 WHERE p.name = 'Paket Lenjer' AND t.name = 'Lenjer'

UNION ALL

-- Paket Telur: 10× Telur
SELECT p.id, t.id, 10
  FROM p CROSS JOIN t
 WHERE p.name = 'Paket Telur' AND t.name = 'Telur'

UNION ALL

-- Paket Adaan: 10× Adaan
SELECT p.id, t.id, 10
  FROM p CROSS JOIN t
 WHERE p.name = 'Paket Adaan' AND t.name = 'Adaan'

UNION ALL

-- Paket Krispi: 10× Krispi
SELECT p.id, t.id, 10
  FROM p CROSS JOIN t
 WHERE p.name = 'Paket Krispi' AND t.name = 'Krispi'

UNION ALL

-- Paket Mix: 3× Lenjer
SELECT p.id, t.id, 3
  FROM p CROSS JOIN t
 WHERE p.name = 'Paket Mix' AND t.name = 'Lenjer'

UNION ALL

-- Paket Mix: 2× Telur
SELECT p.id, t.id, 2
  FROM p CROSS JOIN t
 WHERE p.name = 'Paket Mix' AND t.name = 'Telur'

UNION ALL

-- Paket Mix: 2× Adaan
SELECT p.id, t.id, 2
  FROM p CROSS JOIN t
 WHERE p.name = 'Paket Mix' AND t.name = 'Adaan'

UNION ALL

-- Paket Mix: 3× Krispi
SELECT p.id, t.id, 3
  FROM p CROSS JOIN t
 WHERE p.name = 'Paket Mix' AND t.name = 'Krispi'

UNION ALL

-- Ekstra Cuko: 1× Cuko (INACTIVE type, price = standalone product price)
SELECT p.id, t.id, 1
  FROM p CROSS JOIN t
 WHERE p.name = 'Ekstra Cuko' AND t.name = 'Cuko';

-- ============================================================
-- Verification queries (run separately to check results)
-- ============================================================
-- SELECT name, price, status FROM pempek_types ORDER BY name;
--
-- SELECT
--   p.name AS product,
--   SUM(t.price * pc.quantity) AS computed_price,
--   STRING_AGG(pc.quantity || '× ' || t.name, ', ' ORDER BY t.name) AS composition
-- FROM products p
-- JOIN product_compositions pc ON pc.product_id = p.id
-- JOIN pempek_types t ON t.id = pc.pempek_type_id
-- GROUP BY p.name
-- ORDER BY p.name;
