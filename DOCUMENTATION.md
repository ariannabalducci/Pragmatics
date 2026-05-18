# Documentazione Tecnica e Logica di Praggymatics

Benvenuto nella documentazione ufficiale di **Praggymatics**, una piattaforma web premium e interattiva progettata per la logopedia e lo sviluppo delle abilità pragmatiche del linguaggio nei bambini.

Questo documento illustra nel dettaglio il funzionamento del sistema, la struttura del codice, l'architettura dei dati e le logiche di business che regolano il funzionamento della mappa, delle sessioni di terapia e della dashboard del terapista.

---

## Indice
1. [Architettura di Riferimento e Database](#1-architettura-di-riferimento-e-database)
2. [Esercizi Speciali (Sotto-Mappe)](#2-esercizi-speciali-sotto-mappe)
3. [Isolamento dei Progressi: Allenamento vs Valutazione](#3-isolamento-dei-progressi-allenamento-vs-valutazione)
4. [Separazione dei Contesti: Seduta Terapista vs Progresso a Casa](#4-separazione-dei-contesti-seduta-terapista-vs-progresso-a-casa)
5. [Dashboard del Terapista e Visualizzatore Chatbot AI](#5-dashboard-del-terapista-e-visualizzatore-chatbot-ai)
6. [Flusso di Esecuzione e API Principali](#6-flusso-di-esecuzione-e-api-principali)

---

## 1. Architettura di Riferimento e Database

La piattaforma è costruita con **Next.js (App Router)**, **TypeScript**, **Prisma ORM**, ed un database relazionale **PostgreSQL**.

### Modello dei Dati Principale (`prisma/schema.prisma`)
Tutte le informazioni relative a utenti, mappe, progressi ed esercitazioni sono salvate nel database. I modelli cardine sono:

*   **`User` & `Child`**: Rappresentano l'utente base e le informazioni specifiche del bambino (es. età, terapista assegnato, tentativi ed appuntamenti).
*   **`ExerciseGroup`**: Rappresenta un nodo della mappa (es. *"Perché bisogna lavarsi i denti?"*). Possiede un `groupType` che identifica la categoria (`cloze`, `sentimenti`, `perche`, `reazioni` o `generic` per il percorso principale).
*   **`Exercise`**: L'esercizio vero e proprio contenuto in un gruppo. Contiene il campo `contentJson` con le frasi o le domande dell'esercizio.
*   **`Path`**: Tabella legacy utilizzata originariamente per mappare lo stato statico (`blocked`, `available`, `completed`) del percorso principale.
*   **`ExerciseAttempt`**: **La tabella chiave dei progressi**. Ogni volta che un bambino completa un esercizio con successo, viene inserito un record in questa tabella.

Per vedere i dettagli completi dello schema, puoi consultare direttamente il file [prisma/schema.prisma](file:///Users/gretaseveri/Desktop/AUI-Pragmatics/prisma/schema.prisma).

---

## 2. Esercizi Speciali (Sotto-Mappe)

A differenza del percorso generico (che sfrutta una tabella di stato statica `Path`), le quattro sotto-mappe speciali:
1.  **Cloze (Completamento Frasi)** - [cloze/page.tsx](file:///Users/gretaseveri/Desktop/AUI-Pragmatics/src/app/cloze/page.tsx)
2.  **Sentimenti (Conversazione Emozioni)** - [sentimenti/page.tsx](file:///Users/gretaseveri/Desktop/AUI-Pragmatics/src/app/sentimenti/page.tsx)
3.  **Perché (Ragionamento Causale AI)** - [perche/page.tsx](file:///Users/gretaseveri/Desktop/AUI-Pragmatics/src/app/perche/page.tsx)
4.  **Reazioni (Scenari Sociali)** - [reazioni/page.tsx](file:///Users/gretaseveri/Desktop/AUI-Pragmatics/src/app/reazioni/page.tsx)

...calcolano lo stato dei nodi **in tempo reale e al 100% dinamicamente** partendo dallo storico dei tentativi (`ExerciseAttempt`).

### Algoritmo di Sblocco Dinamico delle Mappe
Quando un bambino apre ad esempio la mappa "Perché", la rotta API [api/exercises/by-type/[groupType]/route.ts](file:///Users/gretaseveri/Desktop/AUI-Pragmatics/src/app/api/exercises/by-type/%5BgroupType%5D/route.ts) esegue i seguenti passaggi per ciascun gruppo di esercizi, ordinati per titolo in ordine alfabetico:
1.  **Verifica Completamento**: Il gruppo è considerato `completed` se tutti i suoi esercizi hanno almeno un tentativo con successo (`success: true`) registrato nel database per la modalità selezionata.
2.  **Verifica Disponibilità**: Un gruppo non ancora completato è considerato `available` (quindi giocabile, rappresentato dall'icona di Play verde) **solo se** è il **primo gruppo non completato** all'interno dell'ordine sequenziale, ovvero se tutti i gruppi che lo precedono sono nello stato `completed`.
3.  **Bloccato**: Tutti gli altri gruppi successivi rimangono nello stato `blocked` (icona con il lucchetto).

Questo garantisce un percorso ad albero guidato ed immune da bug di sincronizzazione degli stati nel DB.

---

## 3. Isolamento dei Progressi: Allenamento vs Valutazione

Il sistema offre due modalità di gioco indipendenti:
*   **Allenamento (Training)**: Dove il bambino si esercita e può ricevere suggerimenti o aiuti dall'assistente AI (il pappagallino).
*   **Valutazione (Testing)**: Una fase di verifica pura in cui i progressi devono essere tracciati separatamente per dare al terapista un quadro chiaro dei progressi autonomi del bambino.

### Implementazione a Livello di Codice
*   **Database**: È stato aggiunto il campo `mode` (String, default `'training'`) nella tabella `ExerciseAttempt`.
*   **Frontend**: All'accesso, il bambino seleziona la modalità, che viene memorizzata nel client:
    `localStorage.setItem("pragmatics_mode", mode);` (vedi [select-mode/page.tsx](file:///Users/gretaseveri/Desktop/AUI-Pragmatics/src/app/select-mode/page.tsx)).
*   **API di Stato**: Sia le API di caricamento della mappa sia quelle del dettaglio dell'esercizio filtrano i tentativi validi escludendo quelli della modalità opposta:
    ```typescript
    const homeAttempts = child.attempts.filter(a => a.mode === mode);
    ```
*   **Invio dei Dati**: Quando l'esercizio viene completato, la rotta di salvataggio del tentativo registra il valore corretto della modalità corrente passata dal client.

---

## 4. Separazione dei Contesti: Seduta Terapista vs Progresso a Casa

Questa è una delle logiche più complesse e affascinanti del progetto.

> [!IMPORTANT]
> Un bambino deve poter svolgere tutti gli esercizi prescritti dal terapista durante una seduta clinica, ma una volta tornato a casa, la sua mappa normale deve mostrare **esclusivamente il suo progresso domestico autonomo**, senza risultare alterata dalle attività svolte in studio.

### Logica Temporale basata sugli Appuntamenti
1.  **Definizione di Seduta Attiva**: Un appuntamento (`Appointment`) è considerato attivo se la data odierna corrisponde a quella dell'appuntamento ed il tempo corrente del server si trova nell'intervallo:
    `[startTime - 5 minuti, startTime + durata + 5 minuti]`
2.  **Comportamento in Seduta**:
    *   Tutti gli esercizi prescritti dal terapista (`prescribedGroups`) per l'appuntamento corrente vengono **sbloccati forzatamente** e resi immediatamente disponibili (`available` o `completed` se già svolti oggi) sulla mappa del bambino.
    *   Gli tentativi eseguiti vengono salvati normalmente nel database con timestamp corrente.
3.  **Comportamento a Casa (Fuori Seduta)**:
    *   Le API calcolano il progresso domestico **filtrando ed escludendo** tutti i tentativi eseguiti all'interno delle finestre temporali di qualsiasi seduta clinica passata:
        ```typescript
        const isAttemptInSession = (createdAt: Date) => {
            const attTime = new Date(createdAt).getTime();
            return appointments.some(app => {
                const start = new Date(app.startTime).getTime();
                const durationMinutes = parseInt(app.duration?.split(" ")[0] || "45");
                const end = start + durationMinutes * 60000;
                return attTime >= start - buffer && attTime <= end;
            });
        };

        const homeAttempts = child.attempts.filter(a => !isAttemptInSession(a.createdAt) && a.mode === mode);
        ```
    *   Grazie a questo filtro temporale dinamico, non appena la seduta scade, la mappa del bambino ritorna istantaneamente allo stato esatto in cui si trovava prima dell'inizio dell'appuntamento!

---

## 5. Dashboard del Terapista e Visualizzatore Chatbot AI

La dashboard del terapista ([therapist/patients/[studentId]/page.tsx](file:///Users/gretaseveri/Desktop/AUI-Pragmatics/src/app/therapist/patients/%5BstudentId%5D/page.tsx)) consente di monitorare lo storico delle sedute dei pazienti, vedere le risposte fornite ed analizzare l'andamento del linguaggio.

### Visualizzatore delle Conversazioni con il Chatbot
Per gli esercizi basati su chatbot AI (come "Perché" e "Sentimenti"), le risposte e le interazioni del bambino non sono semplici crocette, ma vere e proprie conversazioni interattive generate con l'ausilio di Azure OpenAI (GPT-4o).

*   **Salvataggio**: Lo storico della chat viene strutturato come JSON e salvato all'interno del campo `notes` del record `ExerciseAttempt` al momento del completamento.
*   **Interfaccia del Terapista**: Nella scheda dei risultati delle sedute precedenti del paziente:
    *   Se l'esercizio svolto è di tipo "Perché" o "Sentimenti", compare una riga cliccabile con un badge distintivo *"Vedi Chatbot"*.
    *   Cliccando sul badge, si apre un **modal interattivo premium** che simula graficamente lo schermo del chatbot originale.
    *   Il terapista può scorrere e leggere l'intera conversazione parola per parola, visualizzando i messaggi del pappagallino (a sinistra, in verde/blu) e le risposte del bambino (a destra, in bianco), analizzando le sfumature linguistiche ed i tempi di risposta.

---

## 6. Flusso di Esecuzione e API Principali

Di seguito sono elencate le rotte API che governano il flusso di gioco e come interagiscono con la logica descritta:

### 1. Caricamento Mappa
*   **Rotta**: `GET /api/exercises/by-type/[groupType]?mode=training|testing`
*   **File**: [route.ts (by-type)](file:///Users/gretaseveri/Desktop/AUI-Pragmatics/src/app/api/exercises/by-type/%5BgroupType%5D/route.ts)
*   **Azione**: Calcola gli stati dei nodi della mappa specifica escludendo i tentativi in seduta clinica (se calcolati per il progresso di casa) e filtrando per la modalità selezionata.

### 2. Caricamento Dettaglio Singolo Esercizio
*   **Rotta**: `GET /api/exercise/[exerciseId]?mode=training|testing`
*   **File**: [route.ts (single-exercise)](file:///Users/gretaseveri/Desktop/AUI-Pragmatics/src/app/api/exercise/%5BexerciseId%5D/route.ts)
*   **Azione**: Esegue un controllo di sicurezza per verificare se il bambino ha effettivamente diritto ad accedere a quell'esercizio in quel momento (flusso di sblocco sequenziale o prescrizione attiva oggi). Previene accessi malevoli o diretti tramite URL a nodi bloccati.

### 3. Salvataggio Tentativo
*   **Rotta**: `POST /api/exercise/[exerciseId]/attempt`
*   **Azione**: Registra il completamento dell'esercizio inserendo un record in `ExerciseAttempt` con il tempo di esecuzione, il successo, lo storico chat (se applicabile) e la modalità attiva (`mode`).

---

Questa architettura rende **Praggymatics** uno strumento estremamente flessibile, sicuro e clinicamente accurato, capace di offrire un'esperienza di gioco fluida per il bambino ed un pannello di controllo ricco e dettagliato per il professionista della salute.
