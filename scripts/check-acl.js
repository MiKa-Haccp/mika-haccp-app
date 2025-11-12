// scripts/check-acl.js
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
console.log("has aclAssignment:", !!p.aclAssignment);
p.$disconnect();
