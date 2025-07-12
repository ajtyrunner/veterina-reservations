'use client';

import { useContent } from '../../lib/content-context';

export default function ContentTestPage() {
  const { content, loading, error, t, msg, colors } = useContent();

  if (loading) {
    return <div className="p-8">Načítání content dat...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Chyba při načítání content: {error.message}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Content System Test</h1>
      
      {/* Základní informace */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Tenant Info</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="font-medium text-gray-600">Název:</dt>
            <dd>{content?.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Slug:</dt>
            <dd>{content?.slug}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Subdomain:</dt>
            <dd>{content?.subdomain || 'N/A'}</dd>
          </div>
        </dl>
      </section>

      {/* Barvy */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Colors</h2>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(colors).map(([name, color]) => (
            <div key={name} className="text-center">
              <div 
                className="w-full h-20 rounded-lg mb-2 border"
                style={{ backgroundColor: color }}
              />
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-gray-500">{color}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Labels test */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Label Tests</h2>
        <div className="space-y-2">
          <p><strong>app_name:</strong> {t('app_name')}</p>
          <p><strong>hero_title:</strong> {t('hero_title')}</p>
          <p><strong>hero_subtitle:</strong> {t('hero_subtitle')}</p>
          <p><strong>STAFF:</strong> {t('STAFF')}</p>
          <p><strong>STAFF_PLURAL:</strong> {t('STAFF_PLURAL')}</p>
          <p><strong>CLIENT:</strong> {t('CLIENT')}</p>
          <p><strong>book_appointment:</strong> {t('book_appointment', 'Rezervovat termín')}</p>
          <p><strong>book_training:</strong> {t('book_training', 'Rezervovat trénink')}</p>
        </div>
      </section>

      {/* Messages test */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Message Tests</h2>
        <div className="space-y-2">
          <p><strong>reservation_confirmed:</strong> {msg('reservation_confirmed')}</p>
          <p><strong>reminder:</strong> {msg('reminder', { time: '14:30' })}</p>
          <p><strong>training_confirmed:</strong> {msg('training_confirmed')}</p>
        </div>
      </section>

      {/* Dynamic styling demo */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Dynamic Styling Demo</h2>
        <div className="space-y-4">
          <button 
            className="px-6 py-2 rounded-lg text-white transition-colors"
            style={{ backgroundColor: colors.primary }}
          >
            Primary Button
          </button>
          <button 
            className="px-6 py-2 rounded-lg text-white transition-colors ml-4"
            style={{ backgroundColor: colors.secondary }}
          >
            Secondary Button
          </button>
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.background }}
          >
            Background Color Demo
          </div>
        </div>
      </section>

      {/* Raw content data */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Raw Content Data</h2>
        <pre className="text-xs overflow-auto bg-gray-50 p-4 rounded">
          {JSON.stringify(content, null, 2)}
        </pre>
      </section>
    </div>
  );
}