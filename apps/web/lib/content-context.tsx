'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTenantSlugFromUrl } from './tenant';

interface ContentColors {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  success: string;
  warning: string;
  error: string;
  background: string;
}

interface ContentData {
  name: string;
  slug: string;
  subdomain: string | null;
  colors: ContentColors;
  labels: Record<string, any>;
  messages: Record<string, string>;
  features: string[];
  customContent: Record<string, any>;
}

interface ContentContextType {
  content: ContentData | null;
  loading: boolean;
  error: Error | null;
  t: (key: string, fallback?: string) => string;
  msg: (key: string, variables?: Record<string, string>) => string;
  hasFeature: (feature: string) => boolean;
  colors: ContentColors;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

// Default colors fallback
const DEFAULT_COLORS: ContentColors = {
  primary: '#4F46E5',
  secondary: '#7C3AED',
  accent: '#4F46E5',
  neutral: '#6b7280',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#ffffff'
};

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadContent() {
      try {
        const tenantSlug = getTenantSlugFromUrl();
        
        // Pokud není specifický tenant, použij defaultní hodnoty
        if (tenantSlug === 'default' || !tenantSlug) {
          setContent(null);
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/public/tenant/${tenantSlug}/content`);
        
        if (!response.ok) {
          // Pokud tenant neexistuje, není to kritická chyba - použijeme defaultní hodnoty
          if (response.status === 404) {
            console.warn(`Tenant '${tenantSlug}' not found, using default content`);
            setContent(null);
            setLoading(false);
            return;
          }
          throw new Error('Failed to load content');
        }
        
        const data = await response.json();
        setContent(data);
      } catch (err) {
        console.error('Error loading content:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, []);

  // Helper function to get nested label values
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Translation function with fallback
  const t = (key: string, fallback?: string): string => {
    if (!content) return fallback || key;
    
    let value = getNestedValue(content.labels, key);
    if (value !== undefined && value !== null) {
      value = String(value);
      
      // Replace placeholders like {{STAFF}} with actual values
      const placeholderRegex = /\{\{(\w+)\}\}/g;
      value = value.replace(placeholderRegex, (match: string, placeholder: string) => {
        const replacementValue = getNestedValue(content.labels, placeholder);
        return replacementValue !== undefined ? String(replacementValue) : match;
      });
      
      return value;
    }
    
    return fallback || key;
  };

  // Message function with variable replacement
  const msg = (key: string, variables?: Record<string, string>): string => {
    if (!content) return key;
    
    let message = content.messages[key] || key;
    
    if (variables) {
      Object.entries(variables).forEach(([varKey, varValue]) => {
        message = message.replace(new RegExp(`{{${varKey}}}`, 'g'), varValue);
      });
    }
    
    return message;
  };

  // Check if feature is enabled
  const hasFeature = (feature: string): boolean => {
    return content?.features?.includes(feature) || false;
  };

  const value: ContentContextType = {
    content,
    loading,
    error,
    t,
    msg,
    hasFeature,
    colors: content?.colors || DEFAULT_COLORS
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
}

// CSS custom properties updater
export function applyContentStyles(colors: ContentColors) {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-neutral', colors.neutral);
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-background', colors.background);
}