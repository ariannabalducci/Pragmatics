import { PrismaClient } from '@prisma/client';
import { GET } from '../../../../../src/app/api/exercises/by-type/[groupType]/route';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  const userId = 'b2561b53-26f9-41a2-80e0-acdd09faedbb'; // Timmy
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_aui_pragmatics_2026';
  const token = jwt.sign({ userId, role: 'CHILD' }, secret);

  const request = new Request('http://localhost:3000/api/exercises/by-type/perche?mode=training', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const params = Promise.resolve({ groupType: 'perche' });
  const response = await GET(request, { params });
  const json = await response.json();

  console.log("Actual API response for Timmy (mode=training):");
  console.log(json.map((j: any) => ({ title: j.title, status: j.status, exerciseId: j.exerciseId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
