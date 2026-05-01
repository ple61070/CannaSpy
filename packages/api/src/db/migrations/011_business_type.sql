-- 011_business_type.sql
-- Adds business_type to competitors and dispensaries tables.
-- Values: 'storefront' | 'delivery' | 'both'
-- This standardises operator classification across all tracked entities.

-- up

-- 1. competitors — new column, default storefront
ALTER TABLE competitors
  ADD COLUMN IF NOT EXISTS business_type TEXT
    CHECK (business_type IN ('storefront', 'delivery', 'both'))
    DEFAULT 'storefront';

-- 2. dispensaries — derive from existing license_type column
--    retail        → storefront
--    delivery      → delivery
--    microbusiness → both  (can operate storefront + delivery)
ALTER TABLE dispensaries
  ADD COLUMN IF NOT EXISTS business_type TEXT
    CHECK (business_type IN ('storefront', 'delivery', 'both'))
    DEFAULT 'storefront';

UPDATE dispensaries SET business_type = CASE
  WHEN license_type = 'delivery'      THEN 'delivery'
  WHEN license_type = 'microbusiness' THEN 'both'
  ELSE 'storefront'
END;

-- 3. index for fast filter queries
CREATE INDEX IF NOT EXISTS competitors_business_type ON competitors(business_type);
CREATE INDEX IF NOT EXISTS dispensaries_business_type ON dispensaries(business_type);

-- down
-- ALTER TABLE competitors DROP COLUMN IF EXISTS business_type;
-- ALTER TABLE dispensaries DROP COLUMN IF EXISTS business_type;
-- DROP INDEX IF EXISTS competitors_business_type;
-- DROP INDEX IF EXISTS dispensaries_business_type;
