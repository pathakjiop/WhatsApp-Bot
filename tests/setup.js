#!/usr/bin/env node

console.log('🧹 WhatsApp Bot - Database Cleanup');
console.log('='.repeat(50));

// Set development environment
process.env.NODE_ENV = 'development';

const { inMemoryDB } = require('./src/services/database.service');

console.log('Clearing in-memory database...');
inMemoryDB.clear();

console.log('✅ In-memory database cleared!');
console.log('\n📊 Current stats:');
console.log(JSON.stringify(inMemoryDB.getStats(), null, 2));

console.log('\n✅ Cleanup complete!');