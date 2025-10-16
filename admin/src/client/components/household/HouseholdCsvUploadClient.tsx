"use client";
import "client-only";

import { useEffect, useId, useState } from "react";
import type { PoliticalOrganization } from "@/shared/models/political-organization";
import { Selector, Button } from "@/client/components/ui";
import type { PreviewHouseholdRequest } from "@/server/actions/preview-household";

interface Props {
  organizations: PoliticalOrganization[];
  previewAction: (data: PreviewHouseholdRequest) => Promise<{
    transactions: any[];
    count: number;
    invalidCount: number;
  }>;
  uploadAction: (data: {
    validTransactions: any[];
    politicalOrganizationId: string;
  }) => Promise<{
    ok: boolean;
    processedCount: number;
    savedCount: number;
    skippedCount: number;
    message: string;
    errors?: string[];
  }>;
}

export default function HouseholdCsvUploadClient({
  organizations,
  previewAction,
  uploadAction,
}: Props) {
  const fileInputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [orgId, setOrgId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    transactions: any[];
    count: number;
    invalidCount: number;
  } | null>(null);
  const [message, setMessage] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (organizations.length > 0 && !orgId) setOrgId(organizations[0].id);
  }, [organizations, orgId]);

  async function onPreview() {
    if (!file || !orgId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await previewAction({ file, politicalOrganizationId: orgId });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onUpload() {
    if (!result || !orgId) return;
    setLoading(true);
    setMessage("");
    setErrors([]);
    try {
      const validTransactions = result.transactions.filter(
        (t) => t.status === "insert" || t.status === "update",
      );
      const res = await uploadAction({
        validTransactions,
        politicalOrganizationId: orgId,
      });
      setMessage(res.message);
      if (!res.ok && res.errors) setErrors(res.errors);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        <Selector
          options={organizations.map((o) => ({
            value: o.id,
            label: o.displayName,
          }))}
          value={orgId}
          onChange={setOrgId}
          label="Organization"
          placeholder="-- 組織を選択 --"
          required
        />
        <div>
          <label
            htmlFor={fileInputId}
            className="block text-sm font-medium text-white mb-2"
          >
            CSV File
          </label>
          <input
            id={fileInputId}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="bg-primary-input text-white border border-primary-border rounded-lg px-3 py-2.5 w-full"
            required
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onPreview} disabled={!file || !orgId || loading}>
          {loading ? "Processing…" : "プレビュー"}
        </Button>
        <Button
          onClick={onUpload}
          disabled={
            !result ||
            result.transactions.filter(
              (t) => t.status === "insert" || t.status === "update",
            ).length === 0 ||
            loading
          }
        >
          保存する
        </Button>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      {result && (
        <div className="bg-primary-panel rounded-xl p-4">
          <div className="text-white mb-2">
            件数: {result.count}（無効: {result.invalidCount}）
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-primary-border">
                  <th className="px-2 py-2 text-left text-sm text-white">
                    状態
                  </th>
                  <th className="px-2 py-2 text-left text-sm text-white">
                    日付
                  </th>
                  <th className="px-2 py-2 text-left text-sm text-white">
                    借方
                  </th>
                  <th className="px-2 py-2 text-right text-sm text-white">
                    借方金額
                  </th>
                  <th className="px-2 py-2 text-left text-sm text-white">
                    貸方
                  </th>
                  <th className="px-2 py-2 text-right text-sm text-white">
                    貸方金額
                  </th>
                  <th className="px-2 py-2 text-left text-sm text-white">
                    カテゴリ
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.transactions.slice(0, 20).map((t, i) => (
                  <tr
                    key={`${i}-${t.transaction_no}`}
                    className="border-b border-primary-border/50"
                  >
                    <td className="px-2 py-2 text-sm text-primary-muted">
                      {t.status}
                    </td>
                    <td className="px-2 py-2 text-sm text-white">
                      {new Date(t.transaction_date).toISOString().slice(0, 10)}
                    </td>
                    <td className="px-2 py-2 text-sm text-white">
                      {t.debit_account}
                    </td>
                    <td className="px-2 py-2 text-sm text-white text-right">
                      {t.debit_amount}
                    </td>
                    <td className="px-2 py-2 text-sm text-white">
                      {t.credit_account}
                    </td>
                    <td className="px-2 py-2 text-sm text-white text-right">
                      {t.credit_amount}
                    </td>
                    <td className="px-2 py-2 text-sm text-white">
                      {t.friendly_category}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`mt-3 p-3 rounded border ${errors.length ? "text-red-500 bg-red-900/20 border-red-900/30" : "text-green-500 bg-green-900/20 border-green-900/30"}`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
