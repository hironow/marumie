# marumie 拡張計画: 家計簿・資産管理・世帯のお金管理

作成日: 2025-10-16 / 対象リポジトリ: marumie (webapp, admin, shared, prisma, supabase)

本ドキュメントは現状コードベースのレビューサマリと、家計簿/資産管理/世帯管理へ拡張するための実装計画・DB移行計画・マイルストーン・引き継ぎポイントをまとめたものです。

---

## 1. 現状サマリ（コードレビュー）

- 技術構成
  - Next.js App Router（`webapp`, `admin`）/ TypeScript / Tailwind v4
  - DB: PostgreSQL（Supabase ローカル） + Prisma ORM（`prisma/schema.prisma`）
  - リポジトリ層 + Usecase 層 + Loader/Action で構成（疎結合/テストしやすい設計）
  - CSV インポート（MoneyForward 想定）: `admin/src/server/lib/mf-*.ts` + プレビュー/保存ユースケース
  - 可視化: `webapp` に月次集計、サンキー、収支/貸借などの UI が既にあり再利用可能
- ドメイン
  - `PoliticalOrganization` を主体に、`transactions` と `balance_snapshots` を紐づけ
  - 取引は複式の借方/貸方ベース、政治資金向けカテゴリマッピング（`shared/utils/category-mapping.ts`）
- 強み/活かせる点
  - データ取得→Usecase→UI までのレイヤ分離があり拡張しやすい
  - CSV プレビュー→差分判定→保存の導線が整っている
  - Top ページの集計/可視化を家計向けに横展開可能
- 課題/改善候補
  - エンティティが政治団体前提（`political_organization_id`）で汎化が必要
  - カテゴリマッピングが政治資金前提（家計向けマッピングの追加/切替が必要）
  - 資産口座・残高・投資/負債など資産管理モデルが未整備
  - 世帯/メンバー/共有/按分/精算といった世帯管理モデルが未整備

---

## 2. 目標と非機能要件

- 目標
  - 個人/世帯の収支・予算・資産/負債・ネットワース・配分（按分）を一貫管理
  - インポート（銀行/カード/MF など）と自動分類ルールで入力負荷を低減
  - 既存の政治資金機能は維持（共通基盤へ段階的に統合）
- 非機能
  - 安全なデータ分離（レジャー単位の RBAC）
  - 妥当な移行容易性（段階的移行 / 既存データ互換）
  - 月次 1〜3 万件程度の取引/複数口座でも快適（集計は SQL/インデックス最適化）
  - モバイル優先の UI / アクセシビリティ継続

---

## 3. アーキテクチャ拡張方針（汎化）

- レジャー（帳簿）抽象化
  - `Ledger`（種別: political | household | personal）を新設し、既存 `PoliticalOrganization` を段階的に移行
  - 取引/残高スナップショットは `ledger_id` に紐付ける
- ドメイン分割
  - Core（共通）：取引・分類・集計・CSV インポート基盤
  - Household 拡張：予算、世帯/メンバー、口座/資産、按分/清算、目標
  - Political 拡張：既存のまま（将来 `Ledger` ベースに差し替え）
- 実装単位
  - Prisma モデル追加→既存データ移行→リポジトリ層切替→Usecase/UI 切替の順で段階移行

---

## 4. データモデル（Prisma 追加/変更案）

以下は追加/変更の参考スキーマ（実際の移行では段階的に適用）。

```prisma
// 4.1 Ledger（新規）
model Ledger {
  id          BigInt   @id @default(autoincrement())
  type        LedgerType
  displayName String   @db.VarChar(255)
  slug        String   @unique @db.VarChar(255)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // relations
  transactions      Transaction[]
  balanceSnapshots  BalanceSnapshot[]
  accounts          Account[]
  members           HouseholdMember[]

  @@map("ledgers")
}

enum LedgerType {
  political
  household
  personal
}

// 4.2 Transaction/BalanceSnapshot に ledgerId を追加（移行期間は両持ち）
// 既存: politicalOrganizationId を将来削除予定
model Transaction {
  id             BigInt   @id @default(autoincrement())
  ledgerId       BigInt   @map("ledger_id")
  // ... 既存カラムは維持（transactionNo, dates, amounts, etc）
}

model BalanceSnapshot {
  id             BigInt   @id @default(autoincrement())
  ledgerId       BigInt   @map("ledger_id")
  // ...
}

// 4.3 Household（世帯）/ Member / Role
model HouseholdMember {
  id        BigInt   @id @default(autoincrement())
  ledgerId  BigInt   @map("ledger_id")
  userId    String   @db.Uuid
  name      String   @db.VarChar(255)
  role      HouseholdRole @default(member)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([ledgerId, userId])
  @@map("household_members")
}

enum HouseholdRole {
  owner
  admin
  member
  viewer
}

// 4.4 口座/資産
model Account {
  id           BigInt   @id @default(autoincrement())
  ledgerId     BigInt   @map("ledger_id")
  name         String   @db.VarChar(255)
  type         AccountType
  institution  String?  @db.VarChar(255)
  currency     String   @default("JPY") @db.VarChar(16)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  snapshots AccountSnapshot[]

  @@index([ledgerId, type])
  @@map("accounts")
}

enum AccountType {
  bank
  cash
  credit_card
  e_money
  investment
  loan
}

model AccountSnapshot {
  id         BigInt   @id @default(autoincrement())
  accountId  BigInt   @map("account_id")
  asOfDate   DateTime @db.Date
  balance    Decimal  @db.Decimal(18,2)
  createdAt  DateTime @default(now()) @map("created_at")

  @@unique([accountId, asOfDate])
  @@map("account_snapshots")
}

// 4.5 予算（カテゴリ×月）
model Budget {
  id         BigInt   @id @default(autoincrement())
  ledgerId   BigInt   @map("ledger_id")
  yearMonth  String   @db.VarChar(7) // YYYY-MM
  categoryKey String  @db.VarChar(255)
  amount     Decimal  @db.Decimal(18,2)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@unique([ledgerId, yearMonth, categoryKey])
  @@map("budgets")
}

// 4.6 分類ルール（自動タグ/カテゴリ/分割）
model Rule {
  id         BigInt   @id @default(autoincrement())
  ledgerId   BigInt   @map("ledger_id")
  field      String   // description | label など
  operator   String   // contains | regex
  pattern    String
  action     String   // set:categoryKey=food, set:friendly_category=食費, split:50-50 等
  priority   Int      @default(100)
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@index([ledgerId, priority])
  @@map("rules")
}

// 4.7 按分（メンバー間の費用分担）
model ExpenseShare {
  id             BigInt  @id @default(autoincrement())
  transactionId  BigInt  @map("transaction_id")
  memberId       BigInt  @map("member_id")
  amount         Decimal @db.Decimal(18,2)

  @@unique([transactionId, memberId])
  @@map("expense_shares")
}
```

- カテゴリマッピング
  - `shared/utils/category-mapping.ts` を汎化し、政治資金用と家計用（食費, 住宅, 光熱, 通信, 教養, 交通, 健康/保険, 税金, 子ども, 趣味, 投資, 特別費 など）を切替可能にする
  - Usecase/Repository 側で Ledger.type に応じてマッピング辞書を選択

---

## 5. データ移行計画（段階的）

- Phase A: 新規 `Ledger` 作成 + 移行準備
  - `Ledger` 新規作成、既存 `PoliticalOrganization` 1:1 で `ledgers` へコピー（type=political）
  - `transactions` / `balance_snapshots` に `ledger_id` カラム追加（FK は後付けでも可）
  - バックフィル: 既存行に `ledger_id` を埋める（`political_organization_id` の変換）
  - リポジトリ層に `ledgerId` 対応を追加（既存 API は互換維持）
- Phase B: 新規機能は `ledger_id` のみ利用
  - Household/Personal は `Ledger` 起点で新規に作成
  - 既存 UI は当面 `political_organization_id` を使い続ける
- Phase C: 置換/クリーンアップ
  - コードから `political_organization_id` 依存を段階的に `ledger_id` へ
  - 十分に移行できたらカラム/モデル削除

ロールバック指針: バックフィル前に DB スナップショット、移行スクリプトは冪等化。

---

## 6. Household 拡張機能（スコープ）

- 収支・取引
  - 既存 CSV パイプラインを汎化（家計用カテゴリ辞書/ルール適用/按分サポート）
  - 検索/絞込（期間, 金額, カテゴリ, メモ/ラベル, 口座）
- 予算
  - 月次予算（カテゴリ×月）と実績差分、予算進捗バー/余剰不足一覧
- 資産/負債・ネットワース
  - 口座（銀行/カード/投資/ローン/現金/電子マネー）登録
  - 残高スナップショット（手動/CSV）・口座別/資産配分（ドーナツ）
  - ネットワース推移（折れ線）
- 世帯管理
  - メンバー招待/権限（owner/admin/member/viewer）
  - 共通費の按分（均等/比率/固定額）と精算額算出
- 自動分類ルール
  - 文字列/正規表現でカテゴリ/ラベル/按分を自動適用、優先度順に評価
- レポート
  - 月次ハイライト、固定費/変動費 比率、年間サマリ

---

## 7. UI/UX 変更（webapp/admin）

- 共通
  - 「組織選択」を「レジャー選択」に拡張（political/household/personal 切替）
- webapp（一般ユーザー/世帯向け）
  - ダッシュボード: ネットワース/資産配分/予算進捗/直近支出
  - 取引: フィルタ/編集/タグ/按分/一括操作
  - 予算: カテゴリ×月の編集と進捗可視化
  - 資産: 口座/残高/スナップショット/推移
  - レポート: 月次/年間サマリ
- admin（設定/データ管理者）
  - CSV アップロードをレジャー種別で切替（政治/家計のヘッダ対応）
  - 口座/ルール/予算/メンバー管理 UI

---

## 8. BFF/Usecase/Repository の拡張

- Repository
  - `PrismaTransactionRepository`：`ledgerId` を第一キーに、カテゴリ辞書切替
  - 予算/口座/ルール/按分/メンバーの Prisma リポジトリ追加
- Usecase
  - 予算集計（予算 vs 実績）/ ネットワース計算 / 資産配分 / 按分計算
  - ルール適用パイプライン（CSV 取込時・編集時）
- Loader/Action
  - 既存と同様のキャッシュ戦略（`unstable_cache`）とページ分割

---

## 9. CSV インポート方針

- フォーマット
  - まずは MoneyForward 家計 CSV / 銀行・カード汎用 CSV を優先
  - マッピング層を抽象化（列名→内部取引モデル）
- パイプライン
  - 読込 → 正規化 → ルール適用 → プレビュー（差分/重複/警告） → 保存
- 将来
  - API 連携（OFX/スクレイピングは別途検討、秘密情報は Supabase Vault 周辺で管理）

---

## 10. セキュリティ/権限

- レジャー単位の RBAC（owner/admin/member/viewer）
- Supabase Auth と `users` の突合、`HouseholdMember` によるアクセス制御
- 監査（重要操作の activity log、削除は論理削除検討）

---

## 11. マイグレーション & リリース手順

1) 先行リリース（互換）
- `Ledger`/`ledger_id` 追加、バックフィル、既存機能は現状維持
- 予算/口座/ルール/世帯テーブルを追加（未使用でも可）

2) Household α
- 新規 Household レジャーを作成できる
- 取引 CSV（家計）取込・カテゴリ・基本ダッシュボード

3) Household β
- 予算・資産/ネットワース・ルール・按分・メンバー招待

4) 切替
- 既存 Political を `Ledger` 利用に切替、不要カラム削除

---

### 11.1 現在のマイグレーションスナップショットとロールバック

- 生成済みマイグレーション（追加のみ）
  - `prisma/migrations/20251016_household_minimal/migration.sql`
  - 目的: 追加テーブル（organization_settings / household_members / accounts / account_snapshots / budgets / rules / expense_shares）の初期作成。
- 反映方法（ローカル）
  - Supabase 起動後に `pnpm db:migrate`（`.env.dev` を使用）
- ロールバック方針（最小）
  - 追加テーブルのみのため、影響は限定的。
  - ロールバックは `DROP TABLE` 相当で容易。ただし保存済みデータがある場合は事前にエクスポート。
  - 本番適用前に `migrate deploy` → `migrate resolve --applied` を活用し、移行順序を固定化。


## 12. テスト/品質

- 単体: ルール適用/集計/按分/予算計算
- 結合: CSV 取込〜保存〜集計〜表示
- UI: 重要フォーム/ルーティングの基本 E2E（最小限）
- パフォーマンス: `transactions`/`ledger_id` インデックス、集計クエリの explain 確認

---

## 13. マイルストーン（目安）

- M1（~2週）: Ledger 汎化（DB 追加/バックフィル/リポジトリ対応）
- M2（~2週）: 家計カテゴリ辞書/CSV パイプライン汎化/家計取引一覧
- M3（~2週）: 予算（CRUD/集計/UI）
- M4（~2週）: 口座/資産（スナップショット/ネットワース/配分）
- M5（~2週）: 世帯（メンバー/RBAC/按分/精算）
- M6（~2週）: 仕上げ（レポート/最適化/移行クリーンアップ）

---

## 14. 既知のリスク/検討事項

- スキーマ移行の段階的適用による一時的な二重参照（`political_organization_id` と `ledger_id`）
- カテゴリ辞書の運用（政治/家計の両立、変更履歴/色/キーの管理）
- 投資資産の詳細粒度（銘柄/時価/損益）は初期 scope 外（将来拡張）
- 金融機関連携は CSV を優先（API/スクレイピングは別計画）

---

## 15. 引き継ぎポイント（運用/開発）

- 開発コマンド
  - 初期化: `pnpm dev:setup` / 起動: `pnpm dev`
  - DB: `pnpm db:migrate` `pnpm db:reset` `pnpm db:studio`
- 主要コード位置
  - webapp: `src/app`, `src/server/{usecases,repositories,loaders}`
  - admin:  `src/app`, `src/server/{lib,usecases,actions}`（CSV/プレビュー）
  - shared: `models`, `utils`（カテゴリ辞書など）
  - prisma: `schema.prisma`（マイグレーション）
- 実装順ガイド
  1. Prisma に `Ledger` 他のモデルを追加（マイグレーションは小さく分割）
  2. Repository を `ledgerId` 対応に拡張（既存シグネチャ互換を優先）
  3. 家計カテゴリ辞書を追加し、Usecase 側で辞書切替
  4. webapp のヘッダ選択を「レジャー選択」に拡張
  5. Household の CSV 取込（admin）→ 取引一覧（webapp）
  6. 予算/資産/世帯/按分を順次追加
  7. 最終段に Political も `Ledger` ベースに移行

---

## 16. 完了の受け入れ基準（例）

- M2 完了: Household レジャーで CSV 取込→取引一覧/月次収支が表示できる
- M3 完了: 予算の作成/編集/進捗表示が可能
- M4 完了: 口座残高スナップショットからネットワース/配分が表示できる
- M5 完了: 世帯メンバー招待/権限/按分/精算が可能
- 最終: 既存 Political への回帰テストが通り、`ledger_id` 中心設計へ移行

---

## 付録: 実装の小さな PR 単位例

- PR#1: Prisma に `Ledger` 追加 + バックフィルスクリプト
- PR#2: Transaction/BalanceSnapshot に `ledger_id` 追加 + Repository 拡張
- PR#3: 家計カテゴリ辞書の導入 + 切替ロジック
- PR#4: admin の CSV 取込を `Ledger` 指定対応
- PR#5: webapp のレジャー選択 UI と Household 取引一覧
- PR#6: 予算 CRUD/集計/表示
- PR#7: 口座/スナップショット/ネットワース
- PR#8: 世帯メンバー/RBAC/按分
- PR#9: Political の `Ledger` 化・不要カラム削除

以上。

---

## 17. Minimal Path（最小変更案）

目的: 既存の政治資金向け実装を可能な限り不変に保ち、家計/資産/世帯機能は“追加のみ”で実現する。元の実装の進化に追従しやすく、衝突を最小化する。

- ポリシー
  - 既存テーブル/既存コードは原則変更しない（後方互換）。
  - 新規テーブル/新規ページ/新規ユースケースの追加で拡張する。
  - 政治資金機能は現状維持。家計は独立ルート/独立ユースケースとして横展開。

- DB（新規テーブルのみ追加、既存は不変更）
  - `organization_settings`（FK: `political_organization_id`）
    - `org_type` = political | household | personal
    - `mapping_profile`（カテゴリ辞書の切替）/ `features`（JSONB, トグル）
  - `household_members`（世帯メンバー/RBAC）
    - `political_organization_id`, `user_id`, `role`（owner/admin/member/viewer）
  - `accounts` / `account_snapshots`（口座/資産・残高）
    - `accounts`: `political_organization_id`, `name`, `type`（bank/cash/card/investment/loan…）
    - `account_snapshots`: `account_id`, `as_of_date`（unique）, `balance`
  - `budgets`（カテゴリ×月の予算）
    - 当面は“見える化”優先のためUI/APIは保留。テーブル定義は将来拡張用として維持
  - `rules`（自動分類/ラベル/按分ルール）
    - `field`（description/label 等）, `operator`（contains/regex）, `pattern`, `action`, `priority`, `is_active`
  - `expense_shares`（取引×メンバーの按分）
    - `transaction_id`（既存 `transactions.id` を参照）, `member_id`, `amount`（unique 複合）
  - インデックスは `political_organization_id` と時系列キー（`as_of_date`/`year_month`）に付与。

- コード追加のみ（既存は編集しない方針）
  - shared: `shared/utils/category-mapping.household.ts`（家計カテゴリ辞書）
  - admin: `/(auth)/household/upload-csv`（家計CSV導線）
    - `household-record-converter.ts`（家計CSV→内部取引）
    - `preview-household-csv-usecase.ts` / `save-preview-household-usecase.ts`
    - budgets/accounts/rules/members の最小 CRUD ページ（段階導入）
  - webapp: `src/app/h/[slug]/...`
    - ダッシュボード（最小: 月次収支/最近の支出）/ 取引一覧（家計辞書で表示）
  - repository/usecase: 家計用は新規ファイルで実装（既存 repository へは手を入れない）。

- リリース順（独立PR・小さく分割）
  1) PR: 新規テーブルのマイグレーション（追加のみ）
  2) PR: `category-mapping.household.ts` 追加
  3) PR: admin 家計CSV（コンバータ/プレビュー/保存の最小）
  4) PR: webapp 家計ダッシュボード/取引一覧（最小機能）
  5) （保留）budgets CRUD + 予算進捗（見える化優先のため後段へ）
  6) PR: accounts/snapshots + ネットワース/配分
  7) PR: household_members + RBAC + expense_shares（按分/精算）

- 切替/設定
  - `organization_settings.org_type` で画面/機能分岐。
  - `mapping_profile` でカテゴリ辞書（政治/家計）を選択。
  - 既存政治団体はデフォルト political。家計用は新規「組織」を作成して使う。

- 互換性/ロールバック
  - 既存テーブル・既存コードを変更しないため、ロールバックは新規機能の無効化で対応可能。
  - マイグレーションは「追加のみ」。削除/変更は含めない。

- リスク/注意
  - 2系統（政治/家計）の辞書・画面が併走するため、設定ミス防止に `organization_settings` を必須化。
  - CSV 仕様差異はコンバータ内で吸収し、既存の MF 用ロジックは触らない。

- 将来の汎化（Ledger 化）との整合
  - 本案は将来 `ledger_id` へ付け替えやすいスキーマに寄せる（カーディナリティ/命名を意識）。
  - 最小構成で実運用→十分に安定後に段階的汎化へ移行する。
