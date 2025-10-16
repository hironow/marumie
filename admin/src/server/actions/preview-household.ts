"use server";

import { bufferToString } from "@/server/lib/encoding-converter";
import { PreviewHouseholdCsvUsecase } from "@/server/usecases/preview-household-csv-usecase";

const previewUsecase = new PreviewHouseholdCsvUsecase();

export interface PreviewHouseholdRequest {
  file: File;
  politicalOrganizationId: string;
}

export async function previewHousehold(data: PreviewHouseholdRequest) {
  "use server";
  const { file, politicalOrganizationId } = data;
  if (!file) throw new Error("ファイルが選択されていません");
  if (!politicalOrganizationId) throw new Error("組織IDが指定されていません");

  const csvBuffer = Buffer.from(await file.arrayBuffer());
  const csvContent = bufferToString(csvBuffer);

  return await previewUsecase.execute({
    csvContent,
    politicalOrganizationId,
  });
}
