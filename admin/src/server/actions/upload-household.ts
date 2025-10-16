"use server";

import "server-only";
import { prisma } from "@/server/lib/prisma";
import { PrismaTransactionRepository } from "@/server/repositories/prisma-transaction.repository";
import { SavePreviewTransactionsUsecase } from "@/server/usecases/save-preview-transactions-usecase";
import type { PreviewHouseholdTransaction } from "@/server/lib/household-record-converter";

const transactionRepository = new PrismaTransactionRepository(prisma);
const uploadUsecase = new SavePreviewTransactionsUsecase(transactionRepository);

export interface UploadHouseholdRequest {
  validTransactions: PreviewHouseholdTransaction[];
  politicalOrganizationId: string;
}

export interface UploadHouseholdResponse {
  ok: boolean;
  processedCount: number;
  savedCount: number;
  skippedCount: number;
  message: string;
  errors?: string[];
}

export async function uploadHousehold(
  data: UploadHouseholdRequest,
): Promise<UploadHouseholdResponse> {
  "use server";
  const { validTransactions, politicalOrganizationId } = data;

  if (!validTransactions || !Array.isArray(validTransactions)) {
    throw new Error("有効なトランザクションデータが指定されていません");
  }
  if (!politicalOrganizationId) {
    throw new Error("組織IDが指定されていません");
  }

  const result = await uploadUsecase.execute({
    // TS構造的型付けにより互換（フィールド一致）
    validTransactions: validTransactions as any,
    politicalOrganizationId,
  });

  if (result.errors.length > 0) {
    return {
      ok: false,
      processedCount: result.processedCount,
      savedCount: result.savedCount,
      skippedCount: result.skippedCount,
      message: `${result.processedCount}件を処理し、${result.savedCount}件を保存、${result.skippedCount}件をスキップしました`,
      errors: result.errors,
    };
  }

  return {
    ok: true,
    processedCount: result.processedCount,
    savedCount: result.savedCount,
    skippedCount: result.skippedCount,
    message:
      result.skippedCount > 0
        ? `${result.processedCount}件を処理し、${result.savedCount}件を新規保存、${result.skippedCount}件を重複のためスキップしました`
        : `${result.processedCount}件を処理し、${result.savedCount}件を保存しました`,
  };
}
