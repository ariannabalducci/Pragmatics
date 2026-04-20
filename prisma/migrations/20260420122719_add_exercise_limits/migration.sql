-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "testingExercises" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trainingExercises" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "diagnosis" TEXT;
