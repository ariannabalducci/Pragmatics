/**
 * Script per aggiornare il contentJson degli esercizi nel DB
 * senza fare un seed completo (che resetterebbe i progressi).
 *
 * Eseguire con: npx tsx prisma/update-exercise-content.ts
 */

import { PrismaClient } from '@prisma/client';
import messyBedroom from '../src/lib/exercises/messy_bedroom.json';
import missingHat from '../src/lib/exercises/missing_hat.json';
import happyTears from '../src/lib/exercises/happy_tears.json';
import theNewCook from '../src/lib/exercises/the_new_cook.json';
import uglySweater from '../src/lib/exercises/ugly_sweater.json';

const prisma = new PrismaClient();

const exercisesToUpdate = [
  messyBedroom,
  missingHat,
  happyTears,
  theNewCook,
  uglySweater,
];

async function updateExerciseContent() {
  console.log('🔄 Aggiornamento contentJson esercizi...\n');

  for (const storyData of exercisesToUpdate as any[]) {
    const group = await prisma.exerciseGroup.findFirst({
      where: { title: storyData.name },
      include: { exercises: { orderBy: { position: 'asc' } } }
    });

    if (!group) {
      console.warn(`⚠️  Gruppo non trovato: "${storyData.name}" — skip`);
      continue;
    }

    console.log(`📚 Aggiornamento: "${storyData.name}" (${group.exercises.length} esercizi)`);

    for (let i = 0; i < storyData.order.length; i++) {
      const key = storyData.order[i];
      const exData = storyData[key];
      const dbExercise = group.exercises[i];

      if (!dbExercise) {
        console.warn(`  ⚠️  Esercizio ${i + 1} non trovato nel DB — skip`);
        continue;
      }

      if (!exData) {
        console.warn(`  ⚠️  Chiave "${key}" mancante nel JSON — skip`);
        continue;
      }

      await prisma.exercise.update({
        where: { id: dbExercise.id },
        data: { contentJson: exData }
      });

      console.log(`  ✅ ${key} (posizione ${i + 1}) aggiornato`);
    }
  }

  console.log('\n✨ Aggiornamento completato!');
  await prisma.$disconnect();
}

updateExerciseContent().catch(async (e) => {
  console.error('❌ Errore:', e);
  await prisma.$disconnect();
  process.exit(1);
});
