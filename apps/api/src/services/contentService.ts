import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Typ pro tenant content
export interface TenantContent {
  labels: Record<string, string>
  messages: Record<string, string>
  styles: {
    colors: Record<string, string>
    gradients?: Record<string, string>
    fonts?: Record<string, string>
  }
  emailTemplates?: Record<string, any>
}

// Default content pro fallback (zatím prázdné, později sem přesuneme hardcoded hodnoty)
const DEFAULT_CONTENT: TenantContent = {
  labels: {},
  messages: {},
  styles: {
    colors: {
      primary: '#f97316',
      primaryHover: '#ea580c',
      secondary: '#3b82f6',
      secondaryHover: '#2563eb',
      background: '#fff7ed',
      neutral: '#6b7280'
    }
  }
}

export class ContentService {
  private cache = new Map<string, TenantContent>()
  private cacheTTL = 5 * 60 * 1000 // 5 minut

  /**
   * Získá content pro tenant podle slug
   */
  async getTenantContentBySlug(slug: string): Promise<TenantContent> {
    // Check cache
    const cached = this.cache.get(slug)
    if (cached) {
      return cached
    }

    try {
      // Load from database
      const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          contentData: true,
          customStyles: true,
          contentTemplateId: true,
          contentTemplate: true
        }
      })

      if (!tenant) {
        console.error(`Tenant not found: ${slug}`)
        return DEFAULT_CONTENT
      }

      // Merge content priority: custom > template > default
      const content = this.mergeContent(
        tenant.contentTemplate as any,
        tenant.contentData as any,
        tenant.customStyles as any
      )

      // Cache result
      this.cache.set(slug, content)
      setTimeout(() => this.cache.delete(slug), this.cacheTTL)

      return content
    } catch (error) {
      console.error('Error loading tenant content:', error)
      return DEFAULT_CONTENT
    }
  }

  /**
   * Získá content pro tenant podle ID
   */
  async getTenantContentById(tenantId: string): Promise<TenantContent> {
    const cached = this.cache.get(`id:${tenantId}`)
    if (cached) {
      return cached
    }

    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          slug: true,
          contentData: true,
          customStyles: true,
          contentTemplateId: true,
          contentTemplate: true
        }
      })

      if (!tenant) {
        console.error(`Tenant not found by ID: ${tenantId}`)
        return DEFAULT_CONTENT
      }

      const content = this.mergeContent(
        tenant.contentTemplate as any,
        tenant.contentData as any,
        tenant.customStyles as any
      )

      // Cache by both ID and slug
      this.cache.set(`id:${tenantId}`, content)
      this.cache.set(tenant.slug, content)
      setTimeout(() => {
        this.cache.delete(`id:${tenantId}`)
        this.cache.delete(tenant.slug)
      }, this.cacheTTL)

      return content
    } catch (error) {
      console.error('Error loading tenant content by ID:', error)
      return DEFAULT_CONTENT
    }
  }

  /**
   * Sloučí content z různých zdrojů podle priority
   */
  private mergeContent(
    template: any | null,
    customContent: any | null,
    customStyles: any | null
  ): TenantContent {
    const result: TenantContent = {
      labels: {},
      messages: {},
      styles: {
        colors: {},
        gradients: {},
        fonts: {}
      },
      emailTemplates: {}
    }

    // 1. Default content
    if (DEFAULT_CONTENT.labels) {
      result.labels = { ...DEFAULT_CONTENT.labels }
    }
    if (DEFAULT_CONTENT.messages) {
      result.messages = { ...DEFAULT_CONTENT.messages }
    }
    if (DEFAULT_CONTENT.styles) {
      result.styles = { ...DEFAULT_CONTENT.styles }
    }

    // 2. Template content
    if (template) {
      if (template.labels) {
        result.labels = { ...result.labels, ...template.labels }
      }
      if (template.messages) {
        result.messages = { ...result.messages, ...template.messages }
      }
      if (template.colorScheme) {
        result.styles.colors = { ...result.styles.colors, ...template.colorScheme }
      }
      if (template.emailTemplates) {
        result.emailTemplates = { ...result.emailTemplates, ...template.emailTemplates }
      }
    }

    // 3. Custom content (highest priority)
    if (customContent) {
      if (customContent.labels) {
        result.labels = { ...result.labels, ...customContent.labels }
      }
      if (customContent.messages) {
        result.messages = { ...result.messages, ...customContent.messages }
      }
      if (customContent.emailTemplates) {
        result.emailTemplates = { ...result.emailTemplates, ...customContent.emailTemplates }
      }
    }

    // 4. Custom styles
    if (customStyles) {
      if (customStyles.colors) {
        result.styles.colors = { ...result.styles.colors, ...customStyles.colors }
      }
      if (customStyles.gradients) {
        result.styles.gradients = { ...result.styles.gradients, ...customStyles.gradients }
      }
      if (customStyles.fonts) {
        result.styles.fonts = { ...result.styles.fonts, ...customStyles.fonts }
      }
    }

    return result
  }

  /**
   * Vyčistí cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Aktualizuje content pro tenant
   */
  async updateTenantContent(
    tenantId: string,
    contentData: any,
    customStyles?: any
  ): Promise<void> {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        contentData,
        ...(customStyles && { customStyles })
      }
    })

    // Clear cache for this tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true }
    })

    if (tenant) {
      this.cache.delete(tenant.slug)
      this.cache.delete(`id:${tenantId}`)
    }
  }
}

// Export singleton instance
export const contentService = new ContentService()