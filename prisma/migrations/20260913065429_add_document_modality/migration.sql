-- CreateEnum
CREATE TYPE "LabelKind" AS ENUM ('CLASSIFICATION', 'ENTITY', 'RELATION');

-- AlterEnum
ALTER TYPE "ExportFormat" ADD VALUE 'RAG_JSONL';

-- AlterEnum
ALTER TYPE "ProjectType" ADD VALUE 'DOCUMENT';

-- AlterTable
ALTER TABLE "Label" ADD COLUMN     "kind" "LabelKind" NOT NULL DEFAULT 'CLASSIFICATION';

-- CreateTable
CREATE TABLE "SpanAnnotation" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "start" INTEGER NOT NULL,
    "end" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "source" "AnnotationSource" NOT NULL DEFAULT 'HUMAN',
    "confidence" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpanAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationAnnotation" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "subjectSpanId" TEXT NOT NULL,
    "objectSpanId" TEXT NOT NULL,
    "source" "AnnotationSource" NOT NULL DEFAULT 'HUMAN',
    "confidence" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpanAnnotation_itemId_isActive_idx" ON "SpanAnnotation"("itemId", "isActive");

-- CreateIndex
CREATE INDEX "SpanAnnotation_labelId_idx" ON "SpanAnnotation"("labelId");

-- CreateIndex
CREATE INDEX "RelationAnnotation_itemId_isActive_idx" ON "RelationAnnotation"("itemId", "isActive");

-- CreateIndex
CREATE INDEX "RelationAnnotation_labelId_idx" ON "RelationAnnotation"("labelId");

-- CreateIndex
CREATE INDEX "Label_projectId_kind_idx" ON "Label"("projectId", "kind");

-- AddForeignKey
ALTER TABLE "SpanAnnotation" ADD CONSTRAINT "SpanAnnotation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpanAnnotation" ADD CONSTRAINT "SpanAnnotation_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationAnnotation" ADD CONSTRAINT "RelationAnnotation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationAnnotation" ADD CONSTRAINT "RelationAnnotation_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationAnnotation" ADD CONSTRAINT "RelationAnnotation_subjectSpanId_fkey" FOREIGN KEY ("subjectSpanId") REFERENCES "SpanAnnotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationAnnotation" ADD CONSTRAINT "RelationAnnotation_objectSpanId_fkey" FOREIGN KEY ("objectSpanId") REFERENCES "SpanAnnotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
