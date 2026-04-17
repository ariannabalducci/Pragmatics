/*
  Warnings:

  - The primary key for the `Child` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `topic` on the `Exercise` table. All the data in the column will be lost.
  - The primary key for the `Therapist` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Therapist` table. All the data in the column will be lost.
  - Added the required column `exerciseType` to the `Exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `ExerciseGroup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topic` to the `ExerciseGroup` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('story', 'chat');

-- DropForeignKey
ALTER TABLE "Child" DROP CONSTRAINT "Child_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "ExerciseAttempt" DROP CONSTRAINT "ExerciseAttempt_childId_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_childId_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "Path" DROP CONSTRAINT "Path_childId_fkey";

-- DropForeignKey
ALTER TABLE "_ChildToCollectionItem" DROP CONSTRAINT "_ChildToCollectionItem_A_fkey";

-- DropIndex
DROP INDEX "Child_userId_key";

-- DropIndex
DROP INDEX "Path_childId_position_key";

-- DropIndex
DROP INDEX "Therapist_userId_key";

-- AlterTable
ALTER TABLE "Child" DROP CONSTRAINT "Child_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Child_pkey" PRIMARY KEY ("userId");

-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "title",
DROP COLUMN "topic",
ADD COLUMN     "exerciseType" "ExerciseType" NOT NULL;

-- AlterTable
ALTER TABLE "ExerciseGroup" ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "topic" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Therapist" DROP CONSTRAINT "Therapist_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Therapist_pkey" PRIMARY KEY ("userId");

-- DropEnum
DROP TYPE "ExerciseTopic";

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "note" TEXT,
    "therapistId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Path" ADD CONSTRAINT "Path_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChildToCollectionItem" ADD CONSTRAINT "_ChildToCollectionItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Child"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
