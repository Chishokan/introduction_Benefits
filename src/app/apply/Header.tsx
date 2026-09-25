import Image from "next/image";
import { BENEFIT_LABEL } from "@/lib/constants";

export function ApplyHeader() {
  return (
    <header className="bg-gradient-to-b from-brand-600 to-brand-500 pb-10 pt-6 text-white">
      <div className="mx-auto max-w-xl px-4">
        <div className="inline-block rounded-lg bg-white px-3 py-1.5">
          <Image src="/logo.png" alt="智翔館" width={120} height={40} priority />
        </div>
        <p className="mt-5 text-3xl font-black tracking-tight">Thank you</p>
        <h1 className="mt-1 text-xl font-bold">友人紹介ありがとう！</h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-100">
          必要事項をご入力いただくと、後日 <span className="font-bold text-accent">{BENEFIT_LABEL}</span>{" "}
          のコードをメールでお届けします。
          <br />
          保護者の方がご入力ください。
        </p>
      </div>
    </header>
  );
}
