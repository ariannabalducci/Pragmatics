import { PrismaClient } from "@prisma/client"; const prisma = new PrismaClient(); prisma.appointment.findMany({orderBy:{createdAt:"desc"}, take:2}).then(console.log);
