### Admin アプリの認証セットアップ (Simple Auth)

この管理画面はシンプルな Supabase 認証を導入しています。ログインしないと画面を閲覧できません。

#### セットアップ方法

ローカル開発環境では、データベースシードで自動的にテストユーザーが作成されます：

```bash
# プロジェクトルートから
pnpm db:seed
```

これで以下のテストユーザーが作成されます（seed の定義どおり）：
- 管理者ユーザー: `foo@example.com` / `foo@example.com`
- 一般ユーザー: `bar@example.com` / `bar@example.com`

注意:
- ユーザー作成は Supabase の Service Role Key（Studio → Settings → API）が必要です。`SUPABASE_SERVICE_ROLE_KEY` が未設定の場合、ユーザー作成はスキップされます（DB の他データは投入されます）。
- ローカル Supabase を起動後、Supabase Studio（http://127.0.0.1:54323）→ Settings → API の service_role key を、プロジェクトルートの `.env`（seed 実行時に読み込まれる）またはシェル環境に設定してください。

#### ローカル起動（最短）

1) Supabase を起動（未起動なら）
```bash
pnpm supabase:start
```

2) テストユーザーを含むシードをする場合（任意）
```bash
# ルート .env に以下を設定（Studio → Settings → API）
# SUPABASE_URL=http://127.0.0.1:54321
# SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # Service role key（JWT）
pnpm db:seed
```

3) Admin の環境変数を設定
```bash
cp ./admin/.env.example ./admin/.env.local
# ./admin/.env.local を開いて以下を設定
# SUPABASE_URL=http://127.0.0.1:54321
# SUPABASE_ANON_KEY="eyJ..."   # anon/public key（JWT, Studio → Settings → API）
# （DB を使う機能を動かす場合）DATABASE_URL/DIRECT_URL も supabase の接続文字列へ
```

4) Admin を起動
```bash
pnpm dev:admin
# ブラウザ: http://localhost:3001
```

**環境変数を設定する**
   - `./admin/.env.example` を `./admin/.env.local` にコピー
   - `SUPABASE_URL` と `SUPABASE_ANON_KEY` を設定（クライアント側には公開しません）
   - 値は Supabase ダッシュボード → Settings → API から取得できます（Project URL と anon key）

```bash
cp ./admin/.env.example ./admin/.env.local
# .env.local を開いて URL と anon key を設定
```


#### よくあるエラー

- 「Your project's URL and Key are required to create a Supabase client!」
  - `SUPABASE_URL` または `SUPABASE_ANON_KEY` が設定されていません。
  - `./admin/.env.local` を見直し、開発サーバーを再起動してください。

- 「Invalid login credentials」
  - まず Supabase Studio → Authentication → Users に `foo@example.com` / `bar@example.com` が存在するか確認してください。
  - いない場合は、ルート `.env` に `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY`（Studio → Settings → API の service_role key = JWT）を設定し、`pnpm db:seed` を実行してユーザーを作成してください。
  - 既に存在するのにログインできない場合は、`admin/.env.local` の下記を再確認してください：
    - `SUPABASE_URL=http://127.0.0.1:54321`
    - `SUPABASE_ANON_KEY=<Studio の anon/public key (JWT)>`
  - なお、ベーシック認証が有効だとログイン前に別の認証が要求されます。`BASIC_AUTH_SECRET` をコメントアウト/未設定にしてください（必要な場合のみ設定）。
  - 代替策: Studio → Authentication で手動で `foo@example.com` ユーザーを Password=`foo@example.com` で作成後、`pnpm db:seed` を実行すると DB 側のユーザー行（role）が補完されます。

#### オプション

- 招待 API（`POST /api/invite`）を使う場合は、`SUPABASE_SERVICE_ROLE_KEY` も設定してください（Settings → API の service_role key）。
- DB を使う管理機能（団体・取引の閲覧/CSV 取込など）を動かす場合は、Prisma の接続文字列も `./admin/.env.local` に設定してください。
  - `DATABASE_URL` と `DIRECT_URL`（Supabase Postgres の接続文字列。Settings → Database 参照）

#### 備考

Monorepo 直下の `.env` ではなく、Next.js の動作上 `./admin/.env.local` に置く必要があります。セットアップは今後自動化・ドキュメント整備を進めていきます。

---
