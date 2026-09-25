# 本番環境の準備（Vercel + Supabase + GAS）

## チェックリスト

- [ ] 1. Supabase プロジェクトを作成し、`DATABASE_URL` / `DIRECT_URL` を作る
- [ ] 2. GAS を設定し、`GAS_MAIL_URL` / `GAS_MAIL_SECRET` を用意する（[gas/README.md](../gas/README.md)）
- [ ] 3. `ADMIN_PASSWORD`（経理用）と `SESSION_SECRET` を決める
- [ ] 4. Vercel にリポジトリを取り込み、環境変数を設定してデプロイ（テーブル作成・校舎登録は自動）
- [ ] 5. 経理でログインし、校舎パスワードを設定・校舎担当者へ連絡
- [ ] 6. 期限切れ通知メールのテスト送信を確認
- [ ] 7. 紹介カードの QR コードを新しい URL に差し替え、未使用カードのコードを登録

---

## 1. Supabase

### プロジェクト作成（この設定で作成してください）

| 項目 | 値 |
|------|----|
| Project name | `introduction-benefits` |
| Database Password | 「Generate a password」で自動生成（英数字のみになり URL に使いやすい）。**必ず控える** |
| Region | **Northeast Asia (Tokyo)**（`ap-northeast-1`） |
| Plan | 本番は Pro 推奨（無料プランは無操作が続くと一時停止・自動バックアップなし） |

### 接続文字列

作成後、ダッシュボード上部の **Connect** を開き、**Project ref**（`abcdefghijklmnopqrst` のような20文字）と接続先ホストを確認します。
次の2つの `<PROJECT_REF>` と `<DB_PASSWORD>` を置き換えたものが環境変数の値です。

```
DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
```

| 変数 | 接続方式 | ポート | この方式にした理由 |
|------|---------|-------|------------------|
| `DATABASE_URL` | Transaction pooler | 6543 | Vercel はアクセスごとに起動するため、接続を使い回すプーラー経由にする。`pgbouncer=true` はプーラー用の設定、`connection_limit=1` は同時接続数の食い過ぎ防止 |
| `DIRECT_URL` | Session pooler | 5432 | テーブル作成（マイグレーション）用。Supabase の Direct connection は IPv6 のみで Vercel のビルド環境から接続できないため、IPv4 で使える Session pooler にする |

- Connect 画面の Transaction pooler / Session pooler に表示されるホスト名が `aws-1-ap-northeast-1...` など上記と違う場合は、**画面に表示されたホスト名**を使ってください。
- パスワードに記号を含めた場合は URL エンコードが必要です（例: `@` → `%40`、`#` → `%23`）。自動生成なら不要です。
- テーブルは RLS を有効にした状態で作成されます。Supabase の API キー（anon key）経由ではデータを読めません。アプリで API キーは使いません。

## 2. GAS（通知メール）

[gas/README.md](../gas/README.md) の手順で、社用 Gmail アカウントに Web アプリを作成し、次の2つを用意します。

- `GAS_MAIL_URL`: Web アプリの URL（`https://script.google.com/macros/s/.../exec`）
- `GAS_MAIL_SECRET`: スクリプト プロパティ `MAIL_SECRET` に設定した合言葉

## 3. パスワード・秘密鍵

- `ADMIN_PASSWORD`: 経理用のログインパスワード
- `SESSION_SECRET`: ランダムな32文字以上の文字列（`openssl rand -base64 32` の出力など）。変更すると全員がログアウトされます

## 4. Vercel

### 取り込み

1. https://vercel.com → **Add New… → Project** → GitHub の `Chishokan/introduction_Benefits` を **Import**
2. 設定はリポジトリの `vercel.json` で指定済みのため変更不要
   - Framework: Next.js / Build Command: `npm run vercel-build` / 実行リージョン: 東京（`hnd1`、Supabase と同じ地域）
3. **Environment Variables** に次を入力（Environment は **Production** にチェック）

| 変数 | 値 |
|------|----|
| `DATABASE_URL` | 手順1 |
| `DIRECT_URL` | 手順1 |
| `ADMIN_PASSWORD` | 手順3 |
| `SESSION_SECRET` | 手順3 |
| `GAS_MAIL_URL` | 手順2 |
| `GAS_MAIL_SECRET` | 手順2 |
| `APP_URL` | 公開 URL（最初は `https://<プロジェクト名>.vercel.app`、独自ドメインを付けたらその URL に変更） |

4. **Deploy**

### デプロイ時に自動で行われること（`scripts/vercel-build.mjs`）

本番デプロイ（Production）のときだけ、ビルド前に次を実行します。

1. `prisma migrate deploy` … テーブルの作成・変更（変更がなければ何もしない）
2. 校舎の初期登録 … 校舎が1件もないときだけ「日野校・日宇校・大野校・佐々校」を登録

プレビューデプロイ（Production 以外のブランチ）では本番 DB を変更しません。
プレビューには DB の環境変数を設定していないため、プレビュー URL では画面は動きません（本番の確認は本番 URL で行ってください）。

### 本番ブランチ

Vercel は GitHub リポジトリの**デフォルトブランチ**を本番（Production）としてデプロイします。
デフォルトブランチ（`main` 推奨）へマージされた内容が本番に反映されます。

### 独自ドメイン（任意）

Vercel の **Settings → Domains** でドメイン（例: `shokai.chishokan.jp`）を追加し、表示される DNS レコードをドメイン管理側に登録します。
追加後は `APP_URL` をその URL に変更して再デプロイしてください。

## 5. 校舎パスワード

1. `https://<公開URL>/login` で「経理」を選び `ADMIN_PASSWORD` でログイン
2. 「校舎・パスワード」で各校舎のパスワード（8文字以上）を設定
3. 校舎担当者へ URL（`/login`）と校舎パスワードを連絡

## 6. メールの動作確認

1. 経理画面で、テスト用のコードを「カード配布日」を1か月以上前にして登録
2. `/apply?code=<そのコード>` から自分のメールアドレスで申込み → 期限切れ画面が表示される
3. 期限切れ通知メールが社用 Gmail から届くこと、コード詳細に「期限切れ通知メール：送信済み」と表示されることを確認
4. 確認後、テスト用の申込みとコードを削除

うまく届かない場合は Vercel の **Logs** で `[mail]` を含むログを確認してください（GAS の URL・合言葉の不一致など）。

## 7. 紹介カード

- QR コードの URL: `https://<公開URL>/apply?code=<コード番号>`（招待コードと校舎が入力済みで開く）
  - 全カード共通にする場合は `https://<公開URL>/apply`（保護者がコードを手入力）
- 未使用カードのコード番号を経理画面の「コード登録」で連番登録
- 既存データの移行は README の「スプレッドシートからの移行」を参照（`.env` に本番の `DATABASE_URL` を設定した PC から実行）

## 補足: 手動で DB を操作する場合

`.env` に本番の `DATABASE_URL` / `DIRECT_URL` を設定した PC から実行できます。

```bash
npm run db:deploy   # マイグレーション適用
npm run db:seed     # 校舎の初期登録（未登録時のみ）
npm run import:sheet -- 管理表.csv --dry-run
```
