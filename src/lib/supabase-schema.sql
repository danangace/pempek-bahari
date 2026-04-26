-- ============================================================
-- Pempek Business Website — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Products table (seeded manually via seed-products.sql)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price integer not null,           -- IDR, no decimals
  image_path text,                  -- filename in 'products' storage bucket, e.g. 'pempek-mix.jpg'
  category text not null default 'pempek', -- 'pempek' | 'pelengkap'
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

-- Orders table
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  whatsapp_number text not null,
  address text not null,
  note text,
  total_amount integer not null,    -- IDR
  status text not null default 'pending',
  -- status flow: pending → paid → in_production → delivered
  --              any stage → cancelled
  payment_type text not null default 'bayar_sekarang',
  -- payment_type: 'bayar_sekarang' | 'bayar_nanti'
  delivery_type text not null default 'direct',
  -- delivery_type: 'direct' | 'paxel' | 'grab_express' | 'go_send'
  created_at timestamptz not null default now()
);

-- Order items table (snapshots product name/price at time of order)
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,       -- snapshot
  product_price integer not null,   -- snapshot, IDR
  quantity integer not null check (quantity > 0)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Products: publicly readable
create policy "products_public_read" on products
  for select using (true);

-- Orders: publicly insertable (new orders from customers)
create policy "orders_public_insert" on orders
  for insert with check (true);

-- Orders: readable by anyone knowing the order ID (confirmation page)
create policy "orders_public_read" on orders
  for select using (true);

-- Orders: admin can update status (via anon key — frontend guards with password)
create policy "orders_public_update" on orders
  for update using (true);

-- Order items: publicly insertable
create policy "order_items_public_insert" on order_items
  for insert with check (true);

-- Order items: publicly readable
create policy "order_items_public_read" on order_items
  for select using (true);

-- ============================================================
-- Storage Buckets (create manually in Supabase Dashboard)
-- ============================================================
-- Create a PUBLIC bucket for images/assets (name it whatever you set in VITE_SUPABASE_BUCKET_NAME)
-- Upload product images and logo here.

-- ============================================================
-- Migration: run these if your orders table already exists
-- ============================================================
-- alter table orders add column if not exists payment_type text not null default 'bayar_sekarang';
-- alter table orders add column if not exists delivery_type text not null default 'direct';
-- update orders set payment_type = 'bayar_sekarang' where payment_type is null;
-- update orders set delivery_type = 'direct' where delivery_type is null;
