-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "alarmSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "link" TEXT,
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;
