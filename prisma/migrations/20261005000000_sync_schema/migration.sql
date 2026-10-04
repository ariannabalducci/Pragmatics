-- CreateEnum
CREATE TYPE "ExerciseGroupType" AS ENUM ('generic', 'cloze', 'feelings', 'why', 'reactions');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ExerciseType" ADD VALUE 'cloze';
ALTER TYPE "ExerciseType" ADD VALUE 'feelings';
ALTER TYPE "ExerciseType" ADD VALUE 'why';
ALTER TYPE "ExerciseType" ADD VALUE 'reactions';

-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "progressResetAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ExerciseAttempt" ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'training';

-- AlterTable
ALTER TABLE "ExerciseGroup" ADD COLUMN     "groupType" "ExerciseGroupType" NOT NULL DEFAULT 'generic';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" TEXT,
ADD COLUMN     "googleAccessToken" TEXT,
ADD COLUMN     "googleRefreshToken" TEXT,
ADD COLUMN     "googleTokenExpiresAt" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

