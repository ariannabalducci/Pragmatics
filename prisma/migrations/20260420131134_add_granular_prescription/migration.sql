-- CreateTable
CREATE TABLE "_AppointmentToExerciseGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AppointmentToExerciseGroup_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AppointmentToExerciseGroup_B_index" ON "_AppointmentToExerciseGroup"("B");

-- AddForeignKey
ALTER TABLE "_AppointmentToExerciseGroup" ADD CONSTRAINT "_AppointmentToExerciseGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AppointmentToExerciseGroup" ADD CONSTRAINT "_AppointmentToExerciseGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "ExerciseGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
