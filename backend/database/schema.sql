-- CMS database foundation schema.
-- Engine: InnoDB throughout (FK support + row locking).
-- Charset/collation: utf8mb4 / utf8mb4_unicode_ci everywhere.
--
-- This file is applied automatically by backend/install.php via PDO,
-- statement by statement. It is idempotent: every statement uses
-- IF NOT EXISTS so re-running install.php never fails on an
-- already-provisioned database.

SET NAMES utf8mb4;

-- Schema migration/version tracker.
CREATE TABLE IF NOT EXISTS migrations (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  version      VARCHAR(50)  NOT NULL UNIQUE,
  description  VARCHAR(255) NOT NULL DEFAULT '',
  applied_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin users (multi-user login). Role/status columns power the
-- multi-admin user-management module — see backend/helpers/Permissions.php
-- and backend/api/users/**. Databases provisioned before that module
-- shipped are brought up to this shape by
-- backend/database/migrations/002_admin_user_management.php (run via
-- backend/migrate.php), not by re-running this file.
CREATE TABLE IF NOT EXISTS admins (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(120)  NOT NULL,
  username        VARCHAR(60)   NOT NULL UNIQUE,
  email           VARCHAR(190)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  role            ENUM('super_admin','admin','editor') NOT NULL DEFAULT 'admin',
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  last_login_at   DATETIME      NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_admins_is_active (is_active),
  INDEX idx_admins_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories (first-class, one per post).
CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tags (first-class, many-to-many with posts via blog_post_tags).
CREATE TABLE IF NOT EXISTS tags (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL UNIQUE,
  slug        VARCHAR(80)  NOT NULL UNIQUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog posts. `publish_at` (admin-chosen scheduling target) is distinct
-- from `published_at` (timestamp a post actually first went live) — see
-- backend/database/migrations/003_blog_publish_at.php. Databases
-- provisioned before that migration shipped are brought up to this shape
-- by it (run via backend/migrate.php), not by re-running this file.
CREATE TABLE IF NOT EXISTS blog_posts (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(200)  NOT NULL,
  slug              VARCHAR(220)  NOT NULL UNIQUE,
  description       VARCHAR(400)  NOT NULL DEFAULT '',
  content           LONGTEXT      NOT NULL,
  cover_image_path  VARCHAR(500)  NULL,
  cover_image_alt   VARCHAR(300)  NULL,
  category_id       INT UNSIGNED  NULL,
  author_id         INT UNSIGNED  NOT NULL,
  status            ENUM('draft','published') NOT NULL DEFAULT 'draft',
  featured          TINYINT(1)    NOT NULL DEFAULT 0,
  seo_title         VARCHAR(200)  NULL,
  seo_description   VARCHAR(400)  NULL,
  publish_at        DATETIME      NULL,
  published_at      DATETIME      NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_posts_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_posts_author   FOREIGN KEY (author_id)   REFERENCES admins(id)     ON DELETE RESTRICT,

  INDEX idx_posts_status_published (status, published_at),
  INDEX idx_posts_publish_at (status, publish_at),
  INDEX idx_posts_featured (featured, status, published_at),
  INDEX idx_posts_category (category_id),
  FULLTEXT INDEX ft_posts_search (title, description, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Post <-> Tag (many-to-many).
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id  INT UNSIGNED NOT NULL,
  tag_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  CONSTRAINT fk_bpt_post FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_bpt_tag  FOREIGN KEY (tag_id)  REFERENCES tags(id)       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Uploaded media (cover images + in-editor images).
CREATE TABLE IF NOT EXISTS uploads (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  disk_path     VARCHAR(500)  NOT NULL,
  public_url    VARCHAR(500)  NOT NULL,
  original_name VARCHAR(255)  NOT NULL,
  mime_type     VARCHAR(100)  NOT NULL,
  size_bytes    INT UNSIGNED  NOT NULL,
  width         INT UNSIGNED  NULL,
  height        INT UNSIGNED  NULL,
  uploaded_by   INT UNSIGNED  NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_uploads_uploader FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Key/value application settings (site title, default SEO fallbacks, etc.).
CREATE TABLE IF NOT EXISTS settings (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key   VARCHAR(100) NOT NULL UNIQUE,
  setting_value LONGTEXT     NULL,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
