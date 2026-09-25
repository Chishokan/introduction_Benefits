-- Supabase では public スキーマのテーブルが Data API（PostgREST）から anon キーで参照できてしまうため、
-- RLS を有効にしてポリシーを作らないことで API 経由のアクセスをすべて拒否する。
-- アプリ（Prisma）はテーブル所有者で接続するため RLS の影響を受けない。
ALTER TABLE "Campus" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Referral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Application" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApplyError" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
