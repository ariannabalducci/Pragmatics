import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import bcrypt from 'bcryptjs'

// IMPORTA I FILE JSON DEGLI ESERCIZI
import story1 from '../src/lib/exercises/decorating_a_cake.json'
import story2 from '../src/lib/exercises/mountain_of_homework.json'
import story3 from '../src/lib/exercises/throwing_an_apple.json'
import story4 from '../src/lib/exercises/messy_bedroom.json'
import story5 from '../src/lib/exercises/missing_hat.json'
import story6 from '../src/lib/exercises/happy_tears.json'
import story7 from '../src/lib/exercises/the_new_cook.json'
import story8 from '../src/lib/exercises/ugly_sweater.json'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Svuotamento database e inizio Seed...')

  // 1. PULIZIA TOTALE (In ordine per evitare errori di chiavi esterne)
  await prisma.appointment.deleteMany({}) // <--- NUOVO
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

  // 2. CREAZIONE TERAPISTA
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

  const therapist2User = await prisma.user.create({
    data: {
      username: 'mark_smith',
      password: hashedPassword,
      name: 'Mark',
      surname: 'Smith',
      role: 'THERAPIST',
      therapist: { create: {} }
    },
    include: { therapist: true }
  })

  // 3. CREAZIONE BAMBINO
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
          description: 'Ama i videogiochi',
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
          description: 'Ama i dinosauri',
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

  console.log('Utenti creati. Inizio creazione esercizi...');

  // 4. HELPER CREAZIONE GRUPPI ESERCIZI
  const createGroup = async (storyData: any) => {
    if (!storyData || !storyData.order) {
      console.error(`Errore: Dati mancanti per il gruppo ${storyData?.name}`);
      return null;
    }

    return await prisma.exerciseGroup.create({
      data: {
        title: storyData.name || "Esercizio senza titolo",
        topic: storyData.topic || "Generale",
        exercises: {
          create: storyData.order.map((key: string, index: number) => {
            const exData = storyData[key];
            if (!exData) {
              throw new Error(`Errore nel file "${storyData.name}": chiave "${key}" mancante.`);
            }
            return {
              position: index + 1,
              exerciseType: exData.type,
              contentJson: exData
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

  // 5. CREAZIONE PERCORSO (PATH)
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

  // 6. COLLEZIONE PAPPAGALLI
  const parrotNames = ["Polly", "Kiwi", "Coco", "Amico", "Charlie", "Sole", "Mango", "Pinolo", "Skittles", "Rio", "Tiki", "Zazu"];
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

  // 7. CREAZIONE APPUNTAMENTO DI PROVA
  if (child1.child && therapist1User.therapist) {
    await prisma.appointment.create({
      data: {
        startTime: new Date("2026-04-17T10:00:00Z"), // Giorno del calendario
        type: "valutazione",
        duration: "45 min",
        note: "Seduta iniziale con Timmy",
        therapistId: therapist1User.therapist.userId,
        childId: child1.child.userId
      }
    });
    console.log('Appuntamento di prova creato.');
  }

  console.log('Seed completato con successo! 🦜');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })