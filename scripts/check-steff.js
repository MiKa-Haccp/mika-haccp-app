const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
console.log('has staffProfile:', !!p.staffProfile);
