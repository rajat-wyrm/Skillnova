-- Intern codes support registration and login. Existing users remain valid
-- until a code is assigned, while every assigned code must be unique.
ALTER TABLE "User" ADD COLUMN "internCode" VARCHAR(32);

ALTER TABLE "User"
  ADD CONSTRAINT "User_internCode_alphanumeric_check"
  CHECK ("internCode" IS NULL OR "internCode" ~ '^[A-Za-z0-9]{6,32}$');

ALTER TABLE "User"
  ADD CONSTRAINT "User_internCode_has_letter_check"
  CHECK ("internCode" IS NULL OR "internCode" ~ '[A-Za-z]');

ALTER TABLE "User"
  ADD CONSTRAINT "User_internCode_has_digit_check"
  CHECK ("internCode" IS NULL OR "internCode" ~ '[0-9]');

CREATE UNIQUE INDEX "User_internCode_key" ON "User"("internCode");
