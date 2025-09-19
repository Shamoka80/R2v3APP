-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "rur2_dev";

-- CreateTable
CREATE TABLE "rur2_dev"."StandardVersion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StandardVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rur2_dev"."Clause" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stdId" TEXT NOT NULL,

    CONSTRAINT "Clause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rur2_dev"."Question" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "responseType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "evidenceRequired" BOOLEAN NOT NULL DEFAULT false,
    "appendix" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "helpText" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StandardVersion_code_key" ON "rur2_dev"."StandardVersion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Clause_ref_key" ON "rur2_dev"."Clause"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "Question_questionId_key" ON "rur2_dev"."Question"("questionId");

-- AddForeignKey
ALTER TABLE "rur2_dev"."Clause" ADD CONSTRAINT "Clause_stdId_fkey" FOREIGN KEY ("stdId") REFERENCES "rur2_dev"."StandardVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rur2_dev"."Question" ADD CONSTRAINT "Question_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "rur2_dev"."Clause"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
