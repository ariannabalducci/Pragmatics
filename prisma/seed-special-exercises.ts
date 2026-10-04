/**
 * Seed: Esercizi speciali nel DB
 * Inserisce tutti gli ExerciseGroup e Exercise per:
 *   - cloze (dolly, pippi)
 *   - sentimenti (ladro, aeroporto)
 *   - perche (15 domande)
 *   - reazioni (caduta, cucina)
 *
 * Assegna automaticamente un Path a tutti i bambini esistenti
 * (primo esercizio di ogni tipo = available, resto = blocked)
 *
 * Esegui con: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-special-exercises.ts
 */

import { PrismaClient, ExerciseGroupType } from "@prisma/client";

const prisma = new PrismaClient();

// ─── DATI CLOZE ────────────────────────────────────────────────────────────────

const CLOZE_EXERCISES = [
  {
    title: "DOLLY SFONDA NEL CINEMA",
    topic: "Cloze - Completamento testo",
    groupType: "cloze" as ExerciseGroupType,
    exercises: [
      {
        position: 1,
        exerciseType: "cloze" as any,
        contentJson: {
          id: "dolly",
          segments: [
            "C'era una volta una ", "[1]", " di nome Dolly che faceva la ",
            "[2]", " in un ristorante di città, ma il suo sogno più grande era quello di diventare una famosa ",
            "[3]", ". Ogni giorno andava in edicola ad acquistare il ",
            "[4]", " per leggere se c'erano richieste di attrici. Finalmente un ",
            "[5]", " lesse che poteva presentarsi in Via Garibaldi per una ",
            "[6]", ". Partì il mattino presto e si recò a fare la prova. Il suo stupore fu grande quando scoprì una coda interminabile di aspiranti ",
            "[7]", ". Dolly era molto preoccupata e pensò che non ce l'avrebbe mai fatta a spuntarla sulle concorrenti. Venne il suo turno. Le chiesero di recitare ad alta voce le parole: «Porterò le vostre ",
            "[8]", " quando saranno pronte». Era proprio la frase più adatta per lei che questa frase era abituata a dirla cento volte al giorno. Si classificò ",
            "[9]", " e fu così che, con sua grande gioia, il suo sogno si ",
            "[10]", " e diventò un'attrice famosa.",
          ],
          blankCount: 10,
          words: ["attrice", "ragazza", "audizione", "giornale", "prima", "cameriera", "avverò", "giorno", "attrici", "patatine fritte"],
          solutions: { 1: "ragazza", 2: "cameriera", 3: "attrice", 4: "giornale", 5: "giorno", 6: "audizione", 7: "attrici", 8: "patatine fritte", 9: "prima", 10: "avverò" }
        }
      }
    ]
  },
  {
    title: "PIPPI CALZELUNGHE A SCUOLA",
    topic: "Cloze - Completamento testo",
    groupType: "cloze" as ExerciseGroupType,
    exercises: [
      {
        position: 1,
        exerciseType: "cloze" as any,
        contentJson: {
          id: "pippi",
          segments: [
            "Una mattina Pippi giunse nel cortile della scuola al galoppo del suo ", "[1]",
            ". Scese, spalancò la porta dell'", "[2]",
            " ed entrò, sventolando il suo largo ", "[3]",
            ". «Salute a tutti! Arrivo in tempo per le moltiplicazioni?». Tom e Anna subito batterono le ", "[4]",
            " per la contentezza. «Benvenuta tra noi, Pippi! Intanto dimmi il tuo ", "[5]",
            "», disse la maestra. «Mi chiamo Pippi e sono figlia del capitano Calzelunghe.». «Bene! Cominciamo dall'", "[6]",
            ". Tu sei brava, vero Pippi Calzelunghe? Allora dimmi, quanto fa 7+5?». Pippi, un po' ", "[7]",
            ", guardò la ", "[8]",
            " e rispose: «Così, a occhio e croce, fa 67». «Ma no, 7+5 fa 12!», la corresse la maestra. «Ma se lo sapeva», replicò Pippi, «perché me l'ha chiesto?».",
          ],
          blankCount: 8,
          words: ["cappello", "aritmetica", "cavallo", "cognome", "aula", "mani", "meravigliata", "maestra"],
          solutions: { 1: "cavallo", 2: "aula", 3: "cappello", 4: "mani", 5: "cognome", 6: "aritmetica", 7: "meravigliata", 8: "maestra" }
        }
      }
    ]
  }
];

// ─── DATI SENTIMENTI ───────────────────────────────────────────────────────────

const FEELINGS_EXERCISES = [
  {
    title: "IL LADRO",
    topic: "Sentimenti - Comprensione emotiva",
    groupType: "feelings" as ExerciseGroupType,
    exercises: [
      {
        position: 1,
        exerciseType: "feelings" as any,
        contentJson: {
          id: "thief",
          imageId: "thief",
          questions: [
            "Cosa sta succedendo? Cosa prova il ladro? Come può reagire?",
            "E il commesso e la signora? Cosa provano e come si devono comportare?",
            "Come giudichi la situazione? (Positiva o Negativa)"
          ]
        }
      }
    ]
  },
  {
    title: "L'AEROPORTO",
    topic: "Sentimenti - Comprensione emotiva",
    groupType: "feelings" as ExerciseGroupType,
    exercises: [
      {
        position: 1,
        exerciseType: "feelings" as any,
        contentJson: {
          id: "airport",
          imageId: "airport",
          questions: [
            "Cosa provano i protagonisti? Come si devono comportare?",
            "E la gente che cosa pensa?",
            "Come giudichi la situazione? (Positiva o Negativa)"
          ]
        }
      }
    ]
  }
];

// ─── DATI PERCHÉ ───────────────────────────────────────────────────────────────

const WHY_QUESTIONS = [
  "Perché si devono indossare i vestiti?",
  "Perché si deve andare a scuola?",
  "Perché bisogna andare a lavorare?",
  "Perché si stirano i vestiti prima di indossarli?",
  "Perché ci laviamo le mani?",
  "Perché gli autobus hanno molti sedili/posti?",
  "Perché bisogna lavarsi i denti?",
  "Perché esistono le finestre?",
  "Perché usiamo gli orologi?",
  "Perché dobbiamo dormire?",
  "Perché si indossano le calze prima delle scarpe?",
  "Perché chiudiamo la porta di casa a chiave?",
  "Perché usiamo il telefono?",
  "Perché dormiamo sul materasso?",
  "Perché mettiamo benzina nelle automobili, nei camion e nei motorini?"
];

const WHY_EXERCISES = WHY_QUESTIONS.map((title, i) => ({
  title,
  topic: "Perché - Ragionamento causale",
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

// ─── DATI REAZIONI ─────────────────────────────────────────────────────────────

const REACTIONS_EXERCISES = [
  {
    title: "LA CADUTA NEL GIOCO",
    topic: "Reazioni - Scelta comportamentale",
    groupType: "reactions" as ExerciseGroupType,
    exercises: [
      {
        position: 1,
        exerciseType: "reactions" as any,
        contentJson: {
          id: "fall",
          situationDesc: "Bambino che cade durante un gioco mentre un altro fischia.",
          optionADesc: "Bambino che si avvicina e aiuta il compagno caduto.",
          optionBDesc: "Bambino che urla contro il compagno a terra.",
          correctOption: "A"
        }
      }
    ]
  },
  {
    title: "L'INCIDENTE IN CUCINA",
    topic: "Reazioni - Scelta comportamentale",
    groupType: "reactions" as ExerciseGroupType,
    exercises: [
      {
        position: 1,
        exerciseType: "reactions" as any,
        contentJson: {
          id: "kitchen",
          situationDesc: "Bambino che aiuta la mamma a cucinare ma rovescia la farina.",
          optionADesc: "Mamma che pulisce con faccia triste e manda il bambino in dispensa.",
          optionBDesc: "Mamma che consola il bambino e puliscono la farina insieme.",
          correctOption: "B"
        }
      }
    ]
  }
];

// ─── FUNZIONE PRINCIPALE ───────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Inizio seed esercizi speciali...\n");

  const allGroups = [
    ...CLOZE_EXERCISES,
    ...FEELINGS_EXERCISES,
    ...WHY_EXERCISES,
    ...REACTIONS_EXERCISES,
  ];

  const createdGroupIds: string[] = [];

  for (const groupData of allGroups) {
    // Controlla se esiste già (per idempotenza)
    const existing = await prisma.exerciseGroup.findFirst({
      where: { title: groupData.title, groupType: groupData.groupType }
    });

    if (existing) {
      console.log(`  ⏭  Già presente: "${groupData.title}" (${groupData.groupType})`);
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

    console.log(`  ✅ Creato: "${group.title}" (${group.groupType}) → ID: ${group.id}`);
    createdGroupIds.push(group.id);
  }

  // Ora assegna Path a tutti i bambini esistenti
  console.log("\n📋 Assegnazione Path ai bambini...");

  const allChildren = await prisma.child.findMany({ select: { userId: true } });

  for (const child of allChildren) {
    // Per ogni tipo di esercizio, calcola posizione globale per Path
    // Ogni nuovo gruppo va aggiunto con status 'blocked' tranne il primo di ogni tipo
    
    // Conta i Path già esistenti per questo bambino (per calcolare la posizione)
    const existingPathCount = await prisma.path.count({
      where: { childId: child.userId }
    });

    let positionOffset = existingPathCount;
    
    // Raggruppa per tipo per gestire il "primo disponibile"
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
      // Controlla se il bambino ha già un Path per uno qualunque di questi gruppi
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

        // Prima del tipo = available, gli altri = blocked
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

    console.log(`  ✅ Path assegnati a bambino ${child.userId}`);
  }

  console.log("\n🎉 Seed completato!");
}

main()
  .catch((e) => {
    console.error("❌ Errore:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
