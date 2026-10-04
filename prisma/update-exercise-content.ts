/**
 * Updates the contentJson of existing exercises from the JSON files,
 * without a full seed (which would reset the children's progress).
 *
 * Run with: npx tsx prisma/update-exercise-content.ts
 */

import { Prisma, PrismaClient } from '@prisma/client';
import messyBedroom from '../src/lib/exercises/messy_bedroom.json';
import missingHat from '../src/lib/exercises/missing_hat.json';
import happyTears from '../src/lib/exercises/happy_tears.json';
import theNewCook from '../src/lib/exercises/the_new_cook.json';
import uglySweater from '../src/lib/exercises/ugly_sweater.json';

const prisma = new PrismaClient();

type StoryFile = { name: string; order: string[] } & Record<string, unknown>;

const exercisesToUpdate: StoryFile[] = [
  messyBedroom,
  missingHat,
  happyTears,
  theNewCook,
  uglySweater,
];

async function updateExerciseContent() {
  console.log('🔄 Updating exercise content...\n');

  for (const storyData of exercisesToUpdate) {
    const group = await prisma.exerciseGroup.findFirst({
      where: { title: storyData.name },
      include: { exercises: { orderBy: { position: 'asc' } } }
    });

    if (!group) {
      console.warn(`⚠️  Group not found: "${storyData.name}" — skipped`);
      continue;
    }

    console.log(`📚 Updating "${storyData.name}" (${group.exercises.length} exercises)`);

    for (let i = 0; i < storyData.order.length; i++) {
      const key = storyData.order[i];
      const exData = storyData[key] as Prisma.InputJsonValue | undefined;
      const dbExercise = group.exercises[i];

      if (!dbExercise) {
        console.warn(`  ⚠️  Exercise ${i + 1} not found in the DB — skipped`);
        continue;
      }

      if (!exData) {
        console.warn(`  ⚠️  Key "${key}" missing from the JSON — skipped`);
        continue;
      }

      await prisma.exercise.update({
        where: { id: dbExercise.id },
        data: { contentJson: exData }
      });

      console.log(`  ✅ ${key} (position ${i + 1}) updated`);
    }
  }

  console.log('\n✨ Update completed!');
  await prisma.$disconnect();
}

updateExerciseContent().catch(async (e) => {
  console.error('❌ Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
