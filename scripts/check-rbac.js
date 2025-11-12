// scripts/check-rbac.js
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
console.log("has rbacAssignment:", !!p.rbacAssignment);
p.$disconnect();
