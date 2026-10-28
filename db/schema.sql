CREATE TABLE IF NOT EXISTS products (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug         VARCHAR(80)  NOT NULL,
  name         VARCHAR(80)  NOT NULL,
  tagline      VARCHAR(100) NOT NULL DEFAULT '',
  description  VARCHAR(600) NOT NULL,
  price_cents  INT UNSIGNED NOT NULL,
  image_url    VARCHAR(500) NOT NULL,
  accent       CHAR(7)      NOT NULL DEFAULT '#c6ff3d',
  status       ENUM('available','sold_out','coming_soon') NOT NULL DEFAULT 'available',
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY products_slug_uniq (slug)
);

CREATE TABLE IF NOT EXISTS waitlist (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id   INT UNSIGNED NOT NULL,
  email        VARCHAR(254) NOT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- duplicate prevention: one signup per product per email (emails are stored lowercased)
  UNIQUE KEY waitlist_product_email_uniq (product_id, email),
  CONSTRAINT waitlist_product_fk FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
