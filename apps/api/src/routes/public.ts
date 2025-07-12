import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

// Veřejné API endpointy (bez autentizace)
router.get('/test', (req, res) => {
  res.json({ message: 'Public API is working' });
});

// Content API pro tenant
router.get('/tenant/:identifier/content', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Nejdřív zkus najít podle subdomain, pak podle slug
    let tenant = await prisma.tenant.findUnique({
      where: { subdomain: identifier },
      include: {
        contentTemplate: true
      }
    });

    if (!tenant) {
      tenant = await prisma.tenant.findUnique({
        where: { slug: identifier },
        include: {
          contentTemplate: true
        }
      });
    }

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Type safe parsing of JSON fields
    const customStyles = tenant.customStyles as Record<string, any> || {};
    const contentData = tenant.contentData as Record<string, any> || {};
    const templateColorScheme = tenant.contentTemplate?.colorScheme as Record<string, any> || {};
    const templateLabels = tenant.contentTemplate?.labels as Record<string, any> || {};
    const templateMessages = tenant.contentTemplate?.messages as Record<string, any> || {};

    // Merge template content with custom content
    const content = {
      name: tenant.name,
      slug: tenant.slug,
      subdomain: tenant.subdomain,
      colors: {
        primary: tenant.primaryColor,
        secondary: tenant.secondaryColor,
        ...templateColorScheme,
        ...(customStyles.colors || {})
      },
      labels: {
        ...templateLabels,
        ...contentData
      },
      messages: {
        ...templateMessages,
        ...(contentData.messages || {})
      },
      features: tenant.contentTemplate?.features || [],
      customContent: contentData
    };

    // Add cache control headers to prevent stale data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json(content);
  } catch (error) {
    console.error('Error fetching tenant content:', error);
    res.status(500).json({ error: 'Failed to fetch tenant content' });
  }
});

export default router;