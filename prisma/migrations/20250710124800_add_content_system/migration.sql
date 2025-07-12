-- AlterTable - Přidání content system polí do tabulky tenants (všechna nullable pro bezpečnou migraci)
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "contentData" JSONB;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "customStyles" JSONB;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subdomain" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "googleClientId" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "googleClientSecret" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "enabledFeatures" JSONB;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "contentTemplateId" TEXT;

-- CreateIndex - Unique constraint pro subdomain (pouze pro non-null hodnoty)
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_subdomain_key" ON "tenants"("subdomain") WHERE "subdomain" IS NOT NULL;

-- CreateTable - Content templates tabulka
CREATE TABLE IF NOT EXISTS "content_templates" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "labels" JSONB NOT NULL,
    "messages" JSONB NOT NULL,
    "emailTemplates" JSONB NOT NULL,
    "colorScheme" JSONB NOT NULL,
    "typography" JSONB,
    "features" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex - Unique constraint pro content template name
CREATE UNIQUE INDEX IF NOT EXISTS "content_templates_name_key" ON "content_templates"("name");

-- AddForeignKey - Vztah mezi tenant a content template
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenants_contentTemplateId_fkey'
    ) THEN
        ALTER TABLE "tenants" ADD CONSTRAINT "tenants_contentTemplateId_fkey" 
        FOREIGN KEY ("contentTemplateId") REFERENCES "content_templates"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Create updated_at trigger function pokud neexistuje
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger pro content_templates
DROP TRIGGER IF EXISTS update_content_templates_updated_at ON "content_templates";
CREATE TRIGGER update_content_templates_updated_at 
    BEFORE UPDATE ON "content_templates" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();