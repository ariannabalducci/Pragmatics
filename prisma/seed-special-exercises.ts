/**
 * Seeds the special exercises (cloze, feelings, why, reactions) and gives every
 * existing child a path for them: the first group of each type is available,
 * the others are blocked. Safe to run more than once.
 *
 * Run with: npx tsx prisma/seed-special-exercises.ts
 */

import { PrismaClient, ExerciseGroupType } from "@prisma/client";

const prisma = new PrismaClient();

// ─── CLOZE ─────────────────────────────────────────────────────────────────────

const CLOZE_EXERCISES = [
  {
    title: "DOLLY MAKES IT IN THE MOVIES",
    topic: "Cloze - Text completion",
    groupType: "cloze" as ExerciseGroupType,
    exercises: [
      {
        position: 1,
        exerciseType: "cloze" as any,
        contentJson: {
          id: "dolly",
          segments: [
            "Once upon a time there was a ", "[1]", " named Dolly who worked as a ",
            "[2]", " in a city restaurant, but her biggest dream was to become a famous ",
            "[3]", ". Every day she went to the newsstand to buy the ",
            "[4]", " and check whether anyone was looking for actresses. One ",
            "[5]", " she finally read that she could go to Via Garibaldi for an ",
            "[6]", ". She left early in the morning to try out. She was amazed to find an endless line of aspiring ",
            "[7]", ". Dolly was very worried and thought she would never beat the other candidates. Then it was her turn. They asked her to say these words out loud: “I'll bring your ",
            "[8]", " as soon as they're ready”. It was the perfect line for her, since she said it a hundred times a day. She came in ",
            "[9]", ", and so, to her great joy, her dream came ",
            "[10]", " and she became a famous actress.",
          ],
          blankCount: 10,
          words: ["actress", "girl", "audition", "newspaper", "first", "waitress", "true", "day", "actresses", "french fries"],
          solutions: { 1: "girl", 2: "waitress", 3: "actress", 4: "newspaper", 5: "day", 6: "audition", 7: "actresses", 8: "french fries", 9: "first", 10: "true" }
        }
      }
    ]
  },
  {
    title: "PIPPI LONGSTOCKING AT SCHOOL",
    topic: "Cloze - Text completion",
    groupType: "cloze" as ExerciseGroupType,
    exercises: [
      {
        position: 1,
        exerciseType: "cloze" as any,
        contentJson: {
          id: "pippi",
          segments: [
            "One morning Pippi galloped into the schoolyard on her ", "[1]",
            ". She got off, threw open the ", "[2]",
            " door and walked in, waving her big ", "[3]",
            ". “Hello, everyone! Am I in time for multiplication?” Tommy and Annika clapped their ", "[4]",
            " with joy. “Welcome, Pippi! First, tell me your ", "[5]",
            "”, said the teacher. “My name is Pippi and I'm the daughter of Captain Longstocking.” “Good! Let's start with ", "[6]",
            ". You're clever, aren't you, Pippi Longstocking? So tell me, what is 7+5?” Pippi, a little ", "[7]",
            ", looked at the ", "[8]",
            " and answered: “Roughly, I'd say it's 67.” “No, 7+5 is 12!” the teacher corrected her. “Well, if you already knew,” Pippi replied, “why did you ask me?”",
          ],
          blankCount: 8,
          words: ["hat", "arithmetic", "horse", "surname", "classroom", "hands", "surprised", "teacher"],
          solutions: { 1: "horse", 2: "classroom", 3: "hat", 4: "hands", 5: "surname", 6: "arithmetic", 7: "surprised", 8: "teacher" }
        }
      }
    ]
  }
];

// ─── FEELINGS ──────────────────────────────────────────────────────────────────

const FEELINGS_EXERCISES = [
  {
    title: "THE THIEF",
    topic: "Feelings - Emotional understanding",
    groupType: "feelings" as ExerciseGroupType,
    exercises: [
      {
        position: 1,
        exerciseType: "feelings" as any,
        contentJson: {
          id: "thief",
          imageId: "thief",
          questions: [
            "What is happening? How does the thief feel? How might he react?",
            "What about the shop assistant and the lady? How do they feel, and how should they behave?",
            "How would you judge the situation? (Positive or Negative)"
          ]
        }
      }
    ]
  },
  {
    title: "THE AIRPORT",
    topic: "Feelings - Emotional understanding",
    groupType: "feelings" as ExerciseGroupType,
    exercises: [
      {
        position: 1,
        exerciseType: "feelings" as any,
        contentJson: {
          id: "airport",
          imageId: "airport",
          questions: [
            "How do the main characters feel? How should they behave?",
            "And what do the other people think?",
            "How would you judge the situation? (Positive or Negative)"
          ]
        }
      }
    ]
  }
];

// ─── WHY ───────────────────────────────────────────────────────────────────────

const WHY_QUESTIONS = [
  "Why do we have to wear clothes?",
  "Why do we have to go to school?",
  "Why do people have to go to work?",
  "Why do we iron clothes before wearing them?",
  "Why do we wash our hands?",
  "Why do buses have so many seats?",
  "Why do we need to brush our teeth?",
  "Why do we have windows?",
  "Why do we use clocks?",
  "Why do we need to sleep?",
  "Why do we put on socks before shoes?",
  "Why do we lock the front door?",
  "Why do we use the phone?",
  "Why do we sleep on a mattress?",
  "Why do we put fuel in cars, trucks and scooters?"
];

const WHY_EXERCISES = WHY_QUESTIONS.map((title, i) => ({
  title,
  topic: "Why - Causal reasoning",
  groupType: "why" as ExerciseGroupType,
  exercises: [
    {
      position: 1,
      exerciseType: "why" as any,
      contentJson: {
        id: `why_${i + 1}`,
        questionTitle: title,
        imageId: `why_${i + 1}`
      }
    }
  ]
}));

// ─── REACTIONS ─────────────────────────────────────────────────────────────────

const REACTIONS_EXERCISES = [
  {
    title: "THE FALL DURING THE GAME",
    topic: "Reactions - Choosing how to behave",
    groupType: "reactions" as ExerciseGroupType,
    exercises: [
      {
        position: 1,
        exerciseType: "reactions" as any,
        contentJson: {
          id: "fall",
          situationDesc: "A child falls during a game while another one blows a whistle.",
          optionADesc: "A child goes over and helps the friend who fell.",
          optionBDesc: "A child yells at the friend lying on the ground.",
          correctOption: "A"
        }
      }
    ]
  },
  {
    title: "THE KITCHEN ACCIDENT",
    topic: "Reactions - Choosing how to behave",
    groupType: "reactions" as ExerciseGroupType,
    exercises: [
      {
        position: 1,
        exerciseType: "reactions" as any,
        contentJson: {
          id: "kitchen",
          situationDesc: "A child is helping mom cook but spills the flour.",
          optionADesc: "Mom cleans up with a sad face and sends the child to the pantry.",
          optionBDesc: "Mom comforts the child and they clean up the flour together.",
          correctOption: "B"
        }
      }
    ]
  }
];

// ─── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding special exercises...\n");

  const allGroups = [
    ...CLOZE_EXERCISES,
    ...FEELINGS_EXERCISES,
    ...WHY_EXERCISES,
    ...REACTIONS_EXERCISES,
  ];

  const createdGroupIds: string[] = [];

  for (const groupData of allGroups) {
    const existing = await prisma.exerciseGroup.findFirst({
      where: { title: groupData.title, groupType: groupData.groupType }
    });

    if (existing) {
      console.log(`  ⏭  Already exists: "${groupData.title}" (${groupData.groupType})`);
      createdGroupIds.push(existing.id);
      continue;
    }

    const group = await prisma.exerciseGroup.create({
      data: {
        title: groupData.title,
        topic: groupData.topic,
        groupType: groupData.groupType,
        exercises: {
          create: groupData.exercises.map((ex) => ({
            position: ex.position,
            exerciseType: ex.exerciseType,
            contentJson: ex.contentJson
          }))
        }
      }
    });

    console.log(`  ✅ Created: "${group.title}" (${group.groupType}) → ID: ${group.id}`);
    createdGroupIds.push(group.id);
  }

  console.log("\n📋 Assigning paths to children...");

  const allChildren = await prisma.child.findMany({ select: { userId: true } });

  for (const child of allChildren) {
    // New paths are positioned after the child's existing ones.
    const existingPathCount = await prisma.path.count({
      where: { childId: child.userId }
    });

    let positionOffset = existingPathCount;

    const groupsByType: Record<string, string[]> = {};

    for (const groupId of createdGroupIds) {
      const group = await prisma.exerciseGroup.findUnique({
        where: { id: groupId },
        select: { groupType: true }
      });
      if (!group) continue;
      const type = group.groupType;
      if (!groupsByType[type]) groupsByType[type] = [];
      groupsByType[type].push(groupId);
    }

    for (const [type, groupIds] of Object.entries(groupsByType)) {
      const existingForType = await prisma.path.findMany({
        where: {
          childId: child.userId,
          exerciseGroup: { groupType: type as ExerciseGroupType }
        }
      });
      const existingGroupIds = existingForType.map(p => p.exerciseGroupId);

      for (let i = 0; i < groupIds.length; i++) {
        const groupId = groupIds[i];
        if (existingGroupIds.includes(groupId)) continue;

        const isFirstOfType = existingForType.length === 0 && i === 0;

        await prisma.path.create({
          data: {
            childId: child.userId,
            exerciseGroupId: groupId,
            status: isFirstOfType ? "available" : "blocked",
            position: positionOffset + i
          }
        });
      }
      positionOffset += groupIds.length;
    }

    console.log(`  ✅ Paths assigned to child ${child.userId}`);
  }

  console.log("\n🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
