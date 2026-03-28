-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "rawReportId" TEXT;

-- CreateIndex
CREATE INDEX "Alert_rawReportId_idx" ON "Alert"("rawReportId");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_rawReportId_fkey" FOREIGN KEY ("rawReportId") REFERENCES "RawReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
