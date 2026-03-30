import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

import bcrypt from 'bcryptjs'
import storyJson from '../src/lib/exercises/decorating_a_cake.json'
import storyJson2 from '../src/lib/exercises/mountain_of_homework.json'
import storyJson3 from '../src/lib/exercises/throwing_an_apple.json'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('Starting seed...')

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
          coins: 0,
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

  const child2 = await prisma.user.create({
    data: {
      username: 'matilda_wormwood',
      password: hashedPassword,
      name: 'Matilda',
      surname: 'Wormwood',
      role: 'CHILD',
      child: {
        create: {
          age: 8,
          gender: 'girl',
          ethnicity: 'hispanic',
          coins: 50,
          description: 'Enjoys reading books',
          avatarSkinColor: '#ffffff',
          avatarHairStyle: 'girl_hair_1',
          avatarHairColor: '#ffffff',
          avatarEyes: 'eyes_1',
          avatarClothes: 'clothes_1',
          avatarMouth: 'mouth_1',
          therapist: { connect: { userId: therapist1User.therapist?.userId } }
        }
      }
    },
    include: { child: true }
  })

  console.log('Users created.')

  // Exercise Groups
  const group1 = await prisma.exerciseGroup.create({
    data: {
      title: storyJson.name + " 1",
      topic: storyJson.topic,
      exercises: {
        create: storyJson.order.map((key, index) => {
          const exData = (storyJson as any)[key];
          return {
            position: index + 1,
            exerciseType: exData.type,
            contentJson: exData
          }
        })
      }
    }
  })

  const group2 = await prisma.exerciseGroup.create({
    data: {
      title: storyJson.name + " 2",
      topic: storyJson.topic,
      exercises: {
        create: storyJson.order.map((key, index) => {
          const exData = (storyJson as any)[key];
          return {
            position: index + 1,
            exerciseType: exData.type,
            contentJson: exData
          }
        })
      }
    }
  })

  const group3 = await prisma.exerciseGroup.create({
    data: {
      title: storyJson.name,
      topic: storyJson.topic,
      exercises: {
        create: storyJson.order.map((key, index) => {
          const exData = (storyJson as any)[key];
          return {
            position: index + 1,
            exerciseType: exData.type,
            contentJson: exData
          }
        })
      }
    }
  })

  const group4 = await prisma.exerciseGroup.create({
    data: {
      title: storyJson2.name,
      topic: storyJson2.topic,
      exercises: {
        create: storyJson2.order.map((key, index) => {
          const exData = (storyJson2 as any)[key];
          return {
            position: index + 1,
            exerciseType: exData.type,
            contentJson: exData
          }
        })
      }
    }
  })

  const group5 = await prisma.exerciseGroup.create({
    data: {
      title: storyJson.name + " 5",
      topic: storyJson.topic,
      exercises: {
        create: storyJson.order.map((key, index) => {
          const exData = (storyJson3 as any)[key];
          return {
            position: index + 1,
            exerciseType: exData.type,
            contentJson: exData
          }
        })
      }
    }
  })

  const group6 = await prisma.exerciseGroup.create({
    data: {
      title: storyJson.name,
      topic: storyJson.topic,
      exercises: {
        create: storyJson.order.map((key, index) => {
          const exData = (storyJson as any)[key];
          return {
            position: index + 1,
            exerciseType: exData.type,
            contentJson: exData
          }
        })
      }
    }
  })

  const group7 = await prisma.exerciseGroup.create({
    data: {
      title: storyJson.name + " 7",
      topic: storyJson.topic,
      exercises: {
        create: storyJson.order.map((key, index) => {
          const exData = (storyJson as any)[key];
          return {
            position: index + 1,
            exerciseType: exData.type,
            contentJson: exData
          }
        })
      }
    }
  })

  const group8 = await prisma.exerciseGroup.create({
    data: {
      title: storyJson.name + " 8",
      topic: storyJson.topic,
      exercises: {
        create: storyJson.order.map((key, index) => {
          const exData = (storyJson as any)[key];
          return {
            position: index + 1,
            exerciseType: exData.type,
            contentJson: exData
          }
        })
      }
    }
  })

  const group9 = await prisma.exerciseGroup.create({
    data: {
      title: storyJson.name + " 9",
      topic: storyJson.topic,
      exercises: {
        create: storyJson.order.map((key, index) => {
          const exData = (storyJson as any)[key];
          return {
            position: index + 1,
            exerciseType: exData.type,
            contentJson: exData
          }
        })
      }
    }
  })
  


  // Paths
  const children = [child1, child2];
  const completedGroups = [group1, group2];
  const groups = [group3, group4, group5, group6, group7, group8, group9];

  for (const child of children) {
    if (child.child) {
      let pathCount = 2;
      for (const group of groups) {
        pathCount++;
        await prisma.path.create({
          data: {
            childId: child.child?.userId,
            exerciseGroupId: group.id,
            status: pathCount <= 4 ? 'available' : 'blocked',
            position: pathCount
          }
        })
      }
    }
  }

  for (const child of children) {
    if (child.child) {
      let pathCount = 0;
      for (const group of completedGroups) {
        pathCount++;
        await prisma.path.create({
          data: {
            childId: child.child?.userId,
            exerciseGroupId: group.id,
            status: 'completed',
            position: pathCount
          }
        })
      }
    }
  }

  // TODO: Complete some paths

  // Collection items
  const parrotNames = [
    "Polly", "Kiwi", "Coco", "Buddy", "Charlie", 
    "Sunny", "Mango", "Peanut", "Skittles", "Rio",
    "Tiki", "Zazu"
  ];
  const parrotImages = ["parrot1", "parrot2", "parrot3", "parrot4"]
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