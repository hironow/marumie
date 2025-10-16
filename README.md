# みらいまる見え政治資金

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/team-mirai-volunteer/marumie)

> 政治資金の透明性向上を目指すオープンソースダッシュボード

政治家・政治団体が会計データを透明に公開し、市民が政治資金の流れを理解しやすくするためのWebアプリケーションです。クラウド会計ソフト（MFクラウド・freee等）から取得したデータを可視化し、政治資金報告書の作成も支援します。

チームみらい永田町エンジニアチームが開発しています。

## プロジェクト構成

このプロジェクトは以下のディレクトリ構成で構築されています：

### ディレクトリ構造

```
marumie/
├── webapp/           # フロントエンド（一般ユーザー向け）
│   ├── src/
│   │   ├── app/      # Next.js App Router
│   │   ├── client/   # クライアントサイドコンポーネント
│   │   ├── server/   # サーバーサイドロジック
│   │   └── types/    # 型定義
│   ├── tests/        # テストファイル
│   └── package.json
├── admin/            # 管理画面
│   ├── src/
│   │   ├── app/      # Next.js App Router
│   │   ├── client/   # クライアントサイドコンポーネント
│   │   ├── server/   # サーバーサイドロジック
│   │   ├── types/    # 型定義
│   │   └── middleware.ts
│   ├── tests/        # テストファイル
│   └── package.json
├── shared/           # 共通モデル・型定義・ユーティリティ
│   ├── models/       # 共通データモデル
│   └── utils/        # 共通ユーティリティ関数
├── data/             # サンプルデータ
│   ├── sampledata.csv
│   └── test_current_liabilities.csv
├── supabase/         # Supabaseローカル開発環境設定
│   ├── config.toml
│   └── templates/
├── prisma/           # データベーススキーマ・マイグレーション
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.cjs
├── logs/             # ログファイル
└── docs/             # 設計ドキュメント（その時点での設計メモなので必ずしも正確ではないです）
    └── images/       # ドキュメント用画像
```

### 各ディレクトリの役割

- **webapp/**: 一般ユーザー向けのフロントエンドアプリケーション（政治資金データの可視化）
- **admin/**: 管理者向けの管理画面（データ登録・管理機能）
- **shared/**: webapp と admin で共通して使用するモデル、型定義、ユーティリティ関数
- **data/**: サンプルデータファイル
- **supabase/**: Supabaseローカル開発環境の設定ファイルとテンプレート
- **prisma/**: データベーススキーマ定義、マイグレーションファイル、シードデータ
- **logs/**: ログファイルやデバッグ用データ
- **docs/**: プロジェクトの設計ドキュメント

## 技術スタック

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Prisma ORM, Supabase
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts, ApexCharts, Nivo
- **Database**: PostgreSQL (via Supabase)
- **Development**: pnpm, Biome
- **Testing**: Jest

## 画面イメージ

![アプリケーションのスクリーンショット](docs/images/screenshot.png)

※ 表示されている値は実際の値ではありません。


## ローカル開発手順

このプロジェクトはSupabaseローカル開発環境を使用してローカル開発を行います。

### クイックスタート（最短）

- すべて同時起動（Supabase + webapp + admin）
  ```bash
  pnpm run dev:setup   # 依存関係 + DBリセット/マイグレーション/シード
  pnpm run dev         # Supabase起動後、webapp:3000 と admin:3001 を同時起動
  ```

- 事前に必要な設定
  - ルート `./.env` に DB と Supabase の設定（特に `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY`）。キーは Supabase Studio → Settings → API から取得（Anon/Public と Service Role のJWT）。
  - `admin/.env.local` に `SUPABASE_URL` と `SUPABASE_ANON_KEY`（Studio → Settings → API の anon 公開鍵）
  - （必要なら）`webapp/.env.local` に DB 接続設定

詳細は以下の「Adminのみ」「Webappのみ」手順を参照してください。

### 開発環境セットアップ

1. **初回セットアップ（推奨）**
```bash
pnpm run dev:setup
```
このコマンドで依存関係のインストール、データベースのリセット・マイグレーション・シードデータの投入を一括実行します。

2. **開発サーバーの起動**
```bash
pnpm run dev  # Webapp + 管理画面を同時起動（Supabase自動起動）
```

### よく使うコマンド

#### 開発関連
```bash
pnpm run dev           # Webapp + 管理画面を同時起動（推奨）
pnpm run dev:webapp    # Webappのみ起動
pnpm run dev:admin     # 管理画面のみ起動
```

#### データベース管理
```bash
pnpm run db:reset      # データベース完全リセット（データ削除 + マイグレーション + シード）
pnpm run db:migrate    # マイグレーション実行
pnpm run db:seed       # シードデータ投入
pnpm run db:studio     # Prisma Studio起動
```

#### コード品質チェック
```bash
pnpm run lint          # 全体のLint実行
pnpm run format        # コードフォーマット実行
pnpm run typecheck     # 型チェック実行
pnpm run test          # テスト実行
```

#### Supabase管理
```bash
pnpm run supabase:start   # Supabaseローカル環境起動
pnpm run supabase:stop    # Supabaseローカル環境停止
# キーは Studio で確認: http://127.0.0.1:54323 → Settings → API
```

#### ユーティリティ
```bash
pnpm run clean         # 全てのnode_modulesとSupabaseを停止
pnpm run fresh         # クリーンインストール + セットアップ
```

### Admin のみ起動（ポート: 3001）

1) Supabase を起動（未起動なら）
```bash
pnpm run supabase:start
```

2) シード（テストユーザー作成まで行う場合）
```bash
# ルート .env に以下を設定（Studio → Settings → API）
# SUPABASE_URL=http://127.0.0.1:54321
# SUPABASE_SERVICE_ROLE_KEY="eyJ..."   # Service role key（JWT）
pnpm run db:seed
```

3) Admin 環境変数の設定
```bash
cp admin/.env.example admin/.env.local
# admin/.env.local を開いて、以下を設定
# SUPABASE_URL=http://127.0.0.1:54321
# SUPABASE_ANON_KEY="eyJ..."  # anon/public key（JWT, Studio → Settings → API）
# （DB を使う機能を動かすなら）DATABASE_URL/DIRECT_URL も supabase の接続文字列へ
```

4) Admin を起動
```bash
pnpm run dev:admin
# ブラウザ: http://localhost:3001
```

### Webapp のみ起動（ポート: 3000）

1) Supabase/DB を使う機能がある場合は Supabase を起動
```bash
pnpm run supabase:start
```

2) Webapp 環境変数の設定
```bash
cp webapp/.env.example webapp/.env.local
# webapp/.env.local を開いて必要な値を設定（主に DATABASE_URL 等）
```

3) Webapp を起動
```bash
pnpm run dev:webapp
# ブラウザ: http://localhost:3000
```

### シード/テストユーザー

シード実行でローカルのテストユーザーを作成するには、Supabase の Service Role Key 設定が必要です。

- 前提準備
  - Supabase を起動し、Studio でキーを確認（http://127.0.0.1:54323 → Settings → API）
  - ルートの `.env` に以下を設定：
    ```
    SUPABASE_URL=http://127.0.0.1:54321
    SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # Service role key（JWT）
    ```

- 実行
  ```bash
  pnpm run db:seed       # もしくは pnpm run db:reset でマイグレーション後にシード
  ```

- 作成されるユーザー（prisma/seed.cjs に準拠）
  - 管理者: foo@example.com / foo@example.com
  - 一般ユーザー: bar@example.com / bar@example.com

- 注意
  - `SUPABASE_SERVICE_ROLE_KEY` が未設定の場合、ユーザー作成はスキップされます（その他のシードは実行されます）。
  - 管理画面の動作には `admin/.env.example` を `admin/.env.local` にコピーし、`SUPABASE_URL` と `SUPABASE_ANON_KEY`（公開鍵）も設定してください。
  - `pnpm run db:migrate` は `dotenv -e .env.dev` を参照する設定です。.env.dev を使わない場合は `.env` に統一するか、運用ルールをプロジェクトで揃えてください。

## データベースのマイグレーション

### 本番環境・開発環境
- Vercelで行われるwebappのbuild過程で自動的にマイグレーションが実行されます

### ローカル開発環境
- 以下のコマンドでマイグレーションを実行してください：
```bash
pnpm run db:migrate
```

### ブラウザからの確認方法

- **メインアプリ**: [http://localhost:3000](http://localhost:3000)
- **管理画面**: [http://localhost:3001](http://localhost:3001)
- **Supabase Studio**: [http://127.0.0.1:54323](http://127.0.0.1:54323)
 - **家計CSVプレビュー/保存**: [http://localhost:3001/household/upload-csv](http://localhost:3001/household/upload-csv)

### モックデータの使用

`webapp/.env.local` に以下を追加してモックデータを有効化：
```
USE_MOCK_DATA=true
```

設定後、トランザクションページのバックエンドがモックデータを返すようになります。

## サンプルデータ

`data/sampledata.csv` に政治資金の取引データのサンプルが含まれています。管理画面（ http://localhost:3001 ）の「CSVアップロード」機能からこのファイルをアップロードして確認できます。

家計/世帯機能の最小サンプルは `data/household_sample.csv` を用意しています。管理画面の「家計CSVアップロード」からプレビュー/保存が可能です（シードで `household-sample` 組織が作成されます）。

### 家計CSVフォーマット（最小）

以下のヘッダ行を想定しています（UTF-8, 1行目はヘッダ）。

```
transaction_no,transaction_date,debit_account,debit_sub_account,debit_amount,credit_account,credit_sub_account,credit_amount,description
```

- transaction_no: 取引番号（文字列）
- transaction_date: 取引日（YYYY-MM-DD）
- debit_account / credit_account: 借方/貸方の勘定名（例: 食費, 普通預金, 勤務収入）
- debit_amount / credit_amount: 数値（カンマは自動除去）
- description: メモ（任意）

サンプル: `data/household_sample.csv`

## ライセンス

このプロジェクトは [GNU Affero General Public License v3.0](LICENSE) の下でライセンスされています。

### コントリビューション

このプロジェクトへのコントリビューションを行う場合は、[コントリビューターライセンス契約(CLA)](CLA.md) への同意が必要です。

## ライセンス表示

このソフトウェアを使用する場合は、適切なライセンス表示を行ってください。詳細は [LICENSE](LICENSE) ファイルをご確認ください。
