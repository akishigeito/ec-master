-- ================================================================
-- EC連携管理システム 初期スキーマ
-- ================================================================

-- brands テーブル
CREATE TABLE IF NOT EXISTS brands (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name   TEXT        NOT NULL,
  company_name TEXT        NOT NULL,
  site_url     TEXT,
  sku_prefix   TEXT        NOT NULL,
  sku_last_number INTEGER  NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- products テーブル
CREATE TABLE IF NOT EXISTS products (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  asin            TEXT,
  sku             TEXT,
  jan_code_1      TEXT,
  jan_code_2      TEXT,
  brand_id        UUID        REFERENCES brands(id) ON DELETE RESTRICT,
  product_name    TEXT        NOT NULL,
  image_url       TEXT,
  info_url_1      TEXT,
  info_url_2      TEXT,
  info_url_3      TEXT,
  weight_kg       NUMERIC,
  size_length_cm  NUMERIC,
  size_width_cm   NUMERIC,
  size_height_cm  NUMERIC,
  fba_size        TEXT        NOT NULL DEFAULT '標準'
                              CHECK (fba_size IN ('小型', '標準', '大型', '特大')),
  purchase_price  INTEGER,
  initial_price   INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at 自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- インデックス
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_asin     ON products(asin);
CREATE INDEX idx_products_sku      ON products(sku);
CREATE INDEX idx_brands_sku_prefix ON brands(sku_prefix);

-- RLS (Row Level Security) 有効化
ALTER TABLE brands   ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーのみ全操作を許可（社内管理システムのため）
CREATE POLICY "Authenticated users can manage brands"
  ON brands FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
