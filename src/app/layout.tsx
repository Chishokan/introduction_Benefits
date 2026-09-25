import type { Metadata } from "next";
import { APP_TITLE, SCHOOL_NAME } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_TITLE} | ${SCHOOL_NAME}`,
  description: `${SCHOOL_NAME} 友人紹介特典の申込み・管理`,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
