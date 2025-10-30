-- ============================================================================
-- ONLINE PLANT NURSERY SYSTEM - COMPLETE SQL SCHEMA
-- Database: PostgreSQL (Supabase)
-- Version: 1.0
-- ============================================================================

-- ============================================================================
-- SECTION 1: USER MANAGEMENT & AUTHENTICATION
-- ============================================================================

-- Enhanced Users Table (integrating with existing structure)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'inventory_admin', 'order_admin', 'support_admin', 'content_admin', 'super_admin')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- OTPs Table (existing - verified correct)
CREATE TABLE IF NOT EXISTS public.otps (
  email text NOT NULL,
  otp text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  CONSTRAINT otps_pkey PRIMARY KEY (email),
  CONSTRAINT otps_attempts_check CHECK (attempts >= 0 AND attempts <= 5)
);

-- Password Resets Table (existing - verified correct)
CREATE TABLE IF NOT EXISTS public.password_resets (
  email text NOT NULL UNIQUE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  used_at timestamp with time zone,
  CONSTRAINT password_resets_pkey PRIMARY KEY (email)
);

-- Enhanced Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid NOT NULL,
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  permanent_address text NOT NULL,
  mobile_number text NOT NULL,
  delivery_addresses jsonb DEFAULT '[]'::jsonb,
  preferences jsonb DEFAULT '{}'::jsonb,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT profiles_mobile_check CHECK (mobile_number ~ '^\+?[1-9]\d{9,14}$')
);

-- Enhanced Sessions Table with device tracking
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_id text NOT NULL,
  device_info jsonb,
  ip_address inet,
  jwt_token_hash text NOT NULL,
  refresh_token_hash text,
  last_active timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT sessions_unique_device UNIQUE (user_id, device_id)
);

-- Activity Logs for audit trail
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- SECTION 2: PRODUCT CATALOG MANAGEMENT
-- ============================================================================

-- Categories Table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  parent_id uuid,
  image_url text,
  display_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL
);

-- Products Table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  short_description text,
  category_id uuid NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price numeric(10,2) CHECK (compare_at_price >= price),
  cost_price numeric(10,2) CHECK (cost_price >= 0),
  
  -- Plant specific attributes
  botanical_name text,
  plant_type text,
  light_requirement text,
  water_requirement text,
  growth_rate text,
  mature_size text,
  care_level text CHECK (care_level IN ('easy', 'moderate', 'difficult')),
  pet_friendly boolean DEFAULT false,
  
  -- Inventory
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity integer NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  reorder_level integer DEFAULT 10,
  max_order_quantity integer DEFAULT 100,
  
  -- SEO & Display
  meta_title text,
  meta_description text,
  tags text[],
  
  -- Status
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT
);

-- Product Images Table
CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  image_url text NOT NULL,
  alt_text text,
  display_order integer DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Product Reviews Table
CREATE TABLE public.product_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  order_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  is_verified_purchase boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT false,
  helpful_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT product_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT product_reviews_unique_user_product UNIQUE (product_id, user_id, order_id)
);

-- ============================================================================
-- SECTION 3: SHOPPING CART MANAGEMENT
-- ============================================================================

-- Shopping Carts Table
CREATE TABLE public.carts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT carts_pkey PRIMARY KEY (id),
  CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT carts_check_user_or_session CHECK ((user_id IS NOT NULL) OR (session_id IS NOT NULL))
);

-- Cart Items Table
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE,
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT cart_items_unique_cart_product UNIQUE (cart_id, product_id)
);

-- ============================================================================
-- SECTION 4: ORDER PROCESSING
-- ============================================================================

-- Orders Table
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Pricing
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  tax_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  shipping_cost numeric(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  discount_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
  
  -- Addresses
  shipping_address jsonb NOT NULL,
  billing_address jsonb NOT NULL,
  
  -- Contact
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  
  -- Notes
  customer_notes text,
  admin_notes text,
  
  -- Timestamps
  placed_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmed_at timestamp with time zone,
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT
);

-- Order Items Table
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  product_sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT
);

-- Order Status History Table
CREATE TABLE public.order_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  status text NOT NULL,
  notes text,
  location text,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_status_history_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- SECTION 5: PAYMENT PROCESSING
-- ============================================================================

-- Payment Transactions Table
CREATE TABLE public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  transaction_id text UNIQUE,
  payment_gateway text NOT NULL,
  payment_method text,
  
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  
  gateway_response jsonb,
  failure_reason text,
  
  paid_at timestamp with time zone,
  refunded_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT
);

-- ============================================================================
-- SECTION 6: CUSTOMER SUPPORT
-- ============================================================================

-- Support Tickets Table
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  user_id uuid,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  
  subject text NOT NULL,
  category text NOT NULL CHECK (category IN ('order_issue', 'plant_care', 'technical', 'general', 'complaint')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  
  description text NOT NULL,
  
  assigned_to uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Support Ticket Messages Table
CREATE TABLE public.support_ticket_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  user_id uuid,
  message text NOT NULL,
  is_staff_reply boolean NOT NULL DEFAULT false,
  attachments jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT support_ticket_messages_pkey PRIMARY KEY (id),
  CONSTRAINT support_ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  CONSTRAINT support_ticket_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- FAQs Table
CREATE TABLE public.faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT faqs_pkey PRIMARY KEY (id)
);

-- ============================================================================
-- SECTION 7: CONTENT MANAGEMENT
-- ============================================================================

-- Plant Care Guides Table
CREATE TABLE public.plant_care_guides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  plant_type text,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  featured_image_url text,
  tags text[],
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  author_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT plant_care_guides_pkey PRIMARY KEY (id),
  CONSTRAINT plant_care_guides_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Blog Posts Table
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  featured_image_url text,
  category text,
  tags text[],
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  author_id uuid,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id),
  CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- SECTION 8: NOTIFICATIONS
-- ============================================================================

-- Notifications Table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Email Queue Table
CREATE TABLE public.email_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  template_name text,
  template_data jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  error_message text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT email_queue_pkey PRIMARY KEY (id)
);

-- ============================================================================
-- SECTION 9: ANALYTICS & REPORTING
-- ============================================================================

-- Search History Table (for analytics)
CREATE TABLE public.search_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  search_query text NOT NULL,
  filters_applied jsonb,
  results_count integer,
  clicked_product_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT search_history_pkey PRIMARY KEY (id),
  CONSTRAINT search_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT search_history_clicked_product_id_fkey FOREIGN KEY (clicked_product_id) REFERENCES public.products(id) ON DELETE SET NULL
);

-- ============================================================================
-- SECTION 10: INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- User Management Indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON public.sessions(expires_at);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at);

-- Product Catalog Indexes
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_is_featured ON public.products(is_featured);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_products_stock_quantity ON public.products(stock_quantity);
CREATE INDEX idx_products_tags ON public.products USING GIN(tags);
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON public.product_reviews(user_id);

-- Shopping Cart Indexes
CREATE INDEX idx_carts_user_id ON public.carts(user_id);
CREATE INDEX idx_carts_session_id ON public.carts(session_id);
CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON public.cart_items(product_id);

-- Order Processing Indexes
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_placed_at ON public.orders(placed_at);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);

-- Payment Indexes
CREATE INDEX idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_transaction_id ON public.payment_transactions(transaction_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);

-- Support Indexes
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);

-- Content Management Indexes
CREATE INDEX idx_plant_care_guides_slug ON public.plant_care_guides(slug);
CREATE INDEX idx_plant_care_guides_is_published ON public.plant_care_guides(is_published);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_is_published ON public.blog_posts(is_published);

-- Notifications Indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_email_queue_status ON public.email_queue(status);

-- Search History Indexes
CREATE INDEX idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX idx_search_history_created_at ON public.search_history(created_at);

-- ============================================================================
-- SECTION 11: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
BEGIN
  new_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                      LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  new_ticket_number TEXT;
BEGIN
  new_ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                       LPAD(NEXTVAL('ticket_number_seq')::TEXT, 6, '0');
  RETURN new_ticket_number;
END;
$$ LANGUAGE plpgsql;

-- Sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

-- Function to update product stock after order
CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock when order is placed
CREATE TRIGGER update_stock_after_order_item
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_on_order();

-- ============================================================================
-- SECTION 12: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only view/edit their own profile
CREATE POLICY profiles_user_policy ON public.profiles
  FOR ALL
  USING (auth.uid() = user_id);

-- Carts: Users can only access their own cart
CREATE POLICY carts_user_policy ON public.carts
  FOR ALL
  USING (auth.uid() = user_id);

-- Orders: Users can only view their own orders
CREATE POLICY orders_user_policy ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Notifications: Users can only view their own notifications
CREATE POLICY notifications_user_policy ON public.notifications
  FOR ALL
  USING (auth.uid() = user_id);

-- Admin policies (if using Supabase auth with custom claims)
CREATE POLICY admin_full_access ON public.orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- SECTION 13: VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for products with availability
CREATE OR REPLACE VIEW product_catalog_view AS
SELECT 
  p.id,
  p.sku,
  p.name,
  p.slug,
  p.description,
  p.short_description,
  p.price,
  p.compare_at_price,
  p.botanical_name,
  p.plant_type,
  p.light_requirement,
  p.water_requirement,
  p.care_level,
  p.pet_friendly,
  p.stock_quantity,
  p.is_active,
  p.is_featured,
  c.name as category_name,
  c.slug as category_slug,
  (SELECT image_url FROM public.product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image,
  (SELECT COALESCE(AVG(rating), 0) FROM public.product_reviews WHERE product_id = p.id AND is_approved = true) as avg_rating,
  (SELECT COUNT(*) FROM public.product_reviews WHERE product_id = p.id AND is_approved = true) as review_count,
  CASE 
    WHEN p.stock_quantity > 0 THEN 'in_stock'
    ELSE 'out_of_stock'
  END as availability_status
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
WHERE p.is_active = true;

-- View for order summary
-- Fix for order_summary_view
CREATE OR REPLACE VIEW order_summary_view AS
SELECT 
  o.id,
  o.order_number,
  o.user_id,
  o.status,
  o.payment_status,
  o.total_amount,
  o.placed_at,
  COUNT(oi.id) as item_count,
  u.email as customer_email,
  CONCAT(p.first_name, ' ', p.last_name) as customer_name
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
LEFT JOIN public.users u ON o.user_id = u.id
LEFT JOIN public.profiles p ON o.user_id = p.user_id
GROUP BY 
  o.id, 
  o.order_number, 
  o.user_id, 
  o.status, 
  o.payment_status, 
  o.total_amount, 
  o.placed_at, 
  u.email,
  p.first_name,
  p.last_name;