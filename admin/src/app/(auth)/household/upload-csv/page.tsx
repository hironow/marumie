import "server-only";

import { loadPoliticalOrganizationsData } from "@/server/loaders/load-political-organizations-data";
import HouseholdCsvUploadClient from "@/client/components/household/HouseholdCsvUploadClient";
import { previewHousehold } from "@/server/actions/preview-household";
import { uploadHousehold } from "@/server/actions/upload-household";

export default async function HouseholdUploadCsvPage() {
  const organizations = await loadPoliticalOrganizationsData();

  return (
    <div className="bg-primary-panel rounded-xl p-4">
      <h1 className="text-2xl font-bold text-white mb-6">
        家計CSVアップロード（プレビュー）
      </h1>
      <p className="text-primary-muted mb-4">
        まずはプレビューのみ。保存は後続のPRで対応します。household-sample
        を選ぶと試せます。
      </p>
      <HouseholdCsvUploadClient
        organizations={organizations}
        previewAction={previewHousehold}
        uploadAction={uploadHousehold}
      />
    </div>
  );
}
