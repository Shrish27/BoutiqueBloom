create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  constraint cart_items_customer_product_unique unique (customer_id, product_id)
);

create index if not exists cart_items_customer_id_idx
  on public.cart_items(customer_id);

create index if not exists cart_items_product_id_idx
  on public.cart_items(product_id);

alter table public.cart_items enable row level security;

drop policy if exists "Customers can read their cart items" on public.cart_items;
create policy "Customers can read their cart items"
  on public.cart_items
  for select
  using (auth.uid() = customer_id);

drop policy if exists "Customers can add cart items" on public.cart_items;
create policy "Customers can add cart items"
  on public.cart_items
  for insert
  with check (
    auth.uid() = customer_id
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'customer'
    )
  );

drop policy if exists "Customers can update their cart items" on public.cart_items;
create policy "Customers can update their cart items"
  on public.cart_items
  for update
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

drop policy if exists "Customers can delete their cart items" on public.cart_items;
create policy "Customers can delete their cart items"
  on public.cart_items
  for delete
  using (auth.uid() = customer_id);
