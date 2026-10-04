import { Prisma, PrismaClient, type ExerciseType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import bcrypt from 'bcryptjs'

import story1 from '../src/lib/exercises/decorating_a_cake.json'
import story2 from '../src/lib/exercises/mountain_of_homework.json'
import story3 from '../src/lib/exercises/throwing_an_apple.json'
import story4 from '../src/lib/exercises/messy_bedroom.json'
import story5 from '../src/lib/exercises/missing_hat.json'
import story6 from '../src/lib/exercises/happy_tears.json'
import story7 from '../src/lib/exercises/the_new_cook.json'
import story8 from '../src/lib/exercises/ugly_sweater.json'

type StoryFile = { name: string; topic: string; order: string[] } & Record<string, unknown>

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing the database and seeding...')

  // Delete in dependency order to respect foreign keys.
  await prisma.appointment.deleteMany({})
  await prisma.exerciseAttempt.deleteMany({})
  await prisma.path.deleteMany({})
  await prisma.collectionItem.deleteMany({})
  await prisma.feedback.deleteMany({})
  await prisma.child.deleteMany({})
  await prisma.therapist.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.exercise.deleteMany({})
  await prisma.exerciseGroup.deleteMany({})

  const hashedPassword = await bcrypt.hash('123456', 10)

  // Therapists
  const therapist1User = await prisma.user.create({
    data: {
      username: 'sarah_connor',
      password: hashedPassword,
      name: 'Sarah',
      surname: 'Connor',
      role: 'THERAPIST',
      email: 'greta.jeun@gmail.com',
      therapist: { create: {} }
    },
    include: { therapist: true }
  })

  await prisma.user.create({
    data: {
      username: 'mark_smith',
      password: hashedPassword,
      name: 'Mark',
      surname: 'Smith',
      role: 'THERAPIST',
      email: 'ariannabalduccii@gmail.com',
      therapist: { create: {} }
    },
    include: { therapist: true }
  })

  // Children
  const child1 = await prisma.user.create({
    data: {
      username: 'timmy_turner',
      password: hashedPassword,
      name: 'Timmy',
      surname: 'Turner',
      role: 'CHILD',
      child: {
        create: {
          age: 10,
          gender: 'boy',
          ethnicity: 'caucasian',
          coins: 100,
          description: 'Loves video games',
          avatarSkinColor: '#ffffff',
          avatarHairStyle: 'boy_hair_1',
          avatarHairColor: '#ffffff',
          avatarEyes: 'eyes_1',
          avatarClothes: 'clothes_2',
          avatarMouth: 'mouth_1',
          therapist: { connect: { userId: therapist1User.therapist?.userId } }
        }
      }
    },
    include: { child: true }
  })

  await prisma.user.create({
    data: {
      username: 'sammy_johnson',
      password: hashedPassword,
      name: 'Sammy',
      surname: 'Johnson',
      role: 'CHILD',
      child: {
        create: {
          age: 8,
          gender: 'boy',
          ethnicity: 'caucasian',
          coins: 100,
          description: 'Loves dinosaurs',
          avatarSkinColor: '#ffffff',
          avatarHairStyle: 'boy_hair_1',
          avatarHairColor: '#ffffff',
          avatarEyes: 'eyes_1',
          avatarClothes: 'clothes_2',
          avatarMouth: 'mouth_1',
          therapist: { connect: { userId: therapist1User.therapist?.userId } }
        }
      }
    },
    include: { child: true }
  })

  console.log('Users created. Creating exercises...');

  // Each story JSON file becomes an exercise group.
  const createGroup = async (storyData: StoryFile) => {
    if (!storyData || !storyData.order) {
      console.error(`Error: missing data for group ${storyData?.name}`);
      return null;
    }

    return await prisma.exerciseGroup.create({
      data: {
        title: storyData.name || "Untitled exercise",
        topic: storyData.topic || "General",
        exercises: {
          create: storyData.order.map((key, index) => {
            const exData = storyData[key] as { type: ExerciseType } | undefined;
            if (!exData) {
              throw new Error(`Error in "${storyData.name}": missing key "${key}".`);
            }
            return {
              position: index + 1,
              exerciseType: exData.type,
              contentJson: exData as Prisma.InputJsonValue
            }
          })
        }
      }
    })
  }

  const g1 = await createGroup(story1);
  const g2 = await createGroup(story2);
  const g3 = await createGroup(story3);
  const g4 = await createGroup(story4);
  const g5 = await createGroup(story5);
  const g6 = await createGroup(story6);
  const g7 = await createGroup(story7);
  const g8 = await createGroup(story8);

  const allGroups = [g1, g2, g3, g4, g5, g6, g7, g8];

  // Main path for the first child
  if (child1.child) {
    for (let i = 0; i < allGroups.length; i++) {
      if (allGroups[i]) {
        await prisma.path.create({
          data: {
            childId: child1.child.userId,
            exerciseGroupId: allGroups[i]!.id,
            status: i < 3 ? 'available' : 'blocked',
            position: i + 1
          }
        })
      }
    }
  }

  // Parrot collection
  const parrotNames = ["Polly", "Kiwi", "Coco", "Buddy", "Charlie", "Sunny", "Mango", "Peanut", "Skittles", "Rio", "Tiki", "Zazu"];
  const parrotImages = ["parrot1", "parrot2", "parrot3", "parrot4"];
  for (let i = 0; i < 12; i++) {
    await prisma.collectionItem.create({
      data: {
        name: parrotNames[i],
        price: i * 10,
        imageId: parrotImages[i % parrotImages.length],
      }
    })
  }


}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })