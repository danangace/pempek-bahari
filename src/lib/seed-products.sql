-- ============================================================
-- Pempek Business Website — Product Seed Data
-- Run this in the Supabase SQL Editor AFTER running schema.sql
-- Update prices and image_path values as needed
-- ============================================================

insert into products (name, description, price, image_path, category, is_available) values
  (
    'Pempek Mix',
    'Paket pempek campuran berisi berbagai jenis pempek pilihan. Cocok untuk dinikmati bersama keluarga.',
    65000,
    'mix.webp',
    'pempek',
    true
  ),
  (
    'Pempek Lenjer',
    'Pempek lenjer klasik berbahan ikan tenggiri segar, kenyal dan gurih.',
    45000,
    'lenjer.webp',
    'pempek',
    true
  ),
  (
    'Pempek Telur',
    'Pempek telur lezat dengan isian telur ayam, disajikan bersama kuah cuko.',
    50000,
    'telur.webp',
    'pempek',
    true
  ),
  (
    'Pempek Adaan',
    'Pempek adaan bulat khas Palembang, renyah di luar dan lembut di dalam.',
    45000,
    'adaan.webp',
    'pempek',
    true
  ),
  (
    'Pempek Krispi',
    'Pempek goreng krispi dengan tekstur renyah yang menggugah selera.',
    50000,
    'krispi.webp',
    'pempek',
    true
  ),
  (
    'Ekstra Cuko',
    'Tambahan kuah cuko khas Palembang, asam manis pedas yang autentik.',
    5000,
    'ekstra-cuko.webp',
    'pelengkap',
    true
  );
