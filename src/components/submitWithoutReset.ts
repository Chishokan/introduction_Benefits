import { startTransition, type FormEvent } from "react";

// React 19 は form action の完了後に入力欄をリセットするため、
// 保存エラー時に入力内容が消えないよう onSubmit から action を呼ぶ。
export function submitWithoutReset(action: (data: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  };
}
