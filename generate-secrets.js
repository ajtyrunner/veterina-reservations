#!/usr/bin/env node

/**
 * 🔐 Generator produkčních secrets pro Vercel + Render deployment
 */

const crypto = require('crypto');

console.log('🔐 GENEROVÁNÍ PRODUKČNÍCH SECRETS');
console.log('=====================================\n');

// Generování NEXTAUTH_SECRET
const nextAuthSecret = crypto.randomBytes(32).toString('hex');

console.log('📋 ENVIRONMENT VARIABLES pro Vercel a Render:');
console.log('(Zkopírujte a vložte do Environment Variables)');
console.log('');

console.log('# 🔐 Security');
console.log(`NEXTAUTH_SECRET=${nextAuthSecret}`);
console.log('');

console.log('# 🌍 URLs (⚠️ AKTUALIZUJTE podle skutečných URL po nasazení!)');
console.log('NEXTAUTH_URL=https://your-project-name-xxx.vercel.app');
console.log('API_URL=https://veterina-api.onrender.com');
console.log('NEXT_PUBLIC_API_URL=https://veterina-api.onrender.com');
console.log('FRONTEND_URL=https://your-project-name-xxx.vercel.app');
console.log('');

console.log('# 📧 Google OAuth (vyplňte skutečné hodnoty)');
console.log('GOOGLE_CLIENT_ID=váš-google-client-id');
console.log('GOOGLE_CLIENT_SECRET=váš-google-client-secret');
console.log('');

console.log('# 🗄️ Database (zkopírujte z Render PostgreSQL)');
console.log('DATABASE_URL=postgresql://postgres:password@dpg-xxx.frankfurt-postgres.render.com/veterina_reservations');
console.log('');

console.log('# 🚀 Environment');
console.log('NODE_ENV=production');
console.log('');

console.log('✅ Secrets vygenerovány!');
console.log('💡 NEXTAUTH_SECRET je náhodný 64-char hex string');
console.log('🔗 Použijte stejný NEXTAUTH_SECRET na Vercel i Render');
console.log(''); 