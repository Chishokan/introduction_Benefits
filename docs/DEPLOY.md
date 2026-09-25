# 本番環境の準備

構成: **ホスティング（Next.js）** ＋ **Supabase（DB）** ＋ **GAS（社用 Gmail からメール送信）**

## チェックリスト

- [ ] 1. Supabase プロジェクトを作成し、接続文字列を控える
- [ ] 2. GAS を設定し、Web アプリの URL と合言葉を控える（[gas/README.md](../gas/README.md)）
- [ ] 3. `ADMIN_PASSWORD`（経理用）と `SESSION_SECRET` を決める
- [ ] 4. ホスティング先に環境変数を設定してデプロイ
- [ ] 5. DB にテーブルを作成（マイグレーション）し、校舎を登録
- [ ] 6. 経理でログインし、校舎パスワードを設定・校舎担当者へ連絡
- [ ] 7. 期限切れ通知メールのテスト送信を確認
- [ ] 8. 紹介カードの QR コードを新しい URL に差し替え、未使用カードのコードを登録

---

## 1. Supabase

1. https://supabase.com でプロジェクトを作成（リージョンは **Tokyo (ap-northeast-1)** 推奨）
   - Database Password は控えておく（接続文字列に使います）
2. ダッシュボード上部の **Connect** → **ORMs** タブ → **Prisma** を選択し、表示される2つの値を控える

| 環境変数 | Supabase の表示 | ポート |
|---------|----------------|-------|
| `DATABASE_URL` | Transaction pooler（`?pgbouncer=true` 付き）。末尾に `&connection_limit=1` を追加 | 6543 |
| `DIRECT_URL` | Session pooler（または Direct connection） | 5432 |

- `[YOUR-PASSWORD]` の部分を Database Password に置き換えます。パスワードに記号が含まれる場合は URL エンコードが必要です（例: `@` → `%40`）。
- テーブルは RLS（Row Level Security）を有効にした状態で作成されます。アプリは DB に直接接続するため影響はなく、Supabase の API キー（anon key）経由ではデータを読めません。アプリで Supabase の API キーは使いません。
- 無料プランは一定期間アクセスがないと一時停止されます。本番運用では Pro プラン（自動バックアップあり）を推奨します。

## 2. GAS（通知メール）

[gas/README.md](../gas/README.md) の手順で、社用 Gmail アカウントに Web アプリを作成し、次の2つを控えます。

- `GAS_MAIL_URL`: Web アプリの URL
- `GAS_MAIL_SECRET`: スクリプト プロパティ `MAIL_SECRET` に設定した合言葉

## 3. パスワード・秘密鍵

- `ADMIN_PASSWORD`: 経理用のログインパスワード
- `SESSION_SECRET`: ランダムな32文字以上の文字列（`openssl rand -base64 32` の出力など）。変更すると全員がログアウトされます

## 4. ホスティング（例: Vercel）

1. https://vercel.com で GitHub の `introduction_Benefits` リポジトリを Import
2. Framework Preset は Next.js（自動判定）、**Region は Tokyo (hnd1)** を推奨（Supabase と同じ地域に）
3. Environment Variables に次を設定

| 変数 | 値 |
|------|----|
| `DATABASE_URL` | 手順1 |
| `DIRECT_URL` | 手順1 |
| `ADMIN_PASSWORD` | 手順3 |
| `SESSION_SECRET` | 手順3 |
| `APP_URL` | 公開 URL（例: `https://shokai.chishokan.jp`。独自ドメインを使う場合は Vercel の Domains で設定） |
| `GAS_MAIL_URL` | 手順2 |
| `GAS_MAIL_SECRET` | 手順2 |

4. Deploy（ビルド時に `prisma generate` が実行されます）

## 5. テーブル作成と校舎登録（初回・スキーマ変更時）

`.env` に本番の `DATABASE_URL` / `DIRECT_URL` を設定した PC から実行します。

```bash
npm install
npm run db:deploy   # マイグレーションを適用（テーブル作成）
npm run db:seed     # 校舎（日野校・日宇校・大野校・佐々校）を登録。初回のみ
```

- 以降、アプリの更新でスキーマが変わったとき（`prisma/migrations` にフォルダが増えたとき）は `npm run db:deploy` を再実行します。
- Vercel のビルドコマンドを `npm run db:deploy && npm run build` にすると、デプロイ時に自動で適用できます。

## 6. 校舎パスワード

1. `https://<公開URL>/login` で「経理」を選び `ADMIN_PASSWORD` でログイン
2. 「校舎・パスワード」で各校舎のパスワード（8文字以上）を設定
3. 校舎担当者へ URL（`/login`）と校舎パスワードを連絡

## 7. メールの動作確認

1. 経理画面で、テスト用のコードを「カード配布日」を1か月以上前にして登録
2. `/apply?code=<そのコード>` から自分のメールアドレスで申込み → 期限切れ画面が表示される
3. 期限切れ通知メールが社用 Gmail から届くこと、コード詳細に「期限切れ通知メール：送信済み」と表示されることを確認
4. 確認後、テスト用の申込みとコードを削除

## 8. 紹介カード

- QR コードの URL: `https://<公開URL>/apply?code=<コード番号>`（招待コードと校舎が入力済みで開く）
  - 全カード共通にする場合は `https://<公開URL>/apply`（保護者がコードを手入力）
- 未使用カードのコード番号を経理画面の「コード登録」で連番登録
- 既存データの移行は README の「スプレッドシートからの移行」を参照
