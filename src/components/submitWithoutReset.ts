import { startTransition, type FormEvent } from "react";

// React 19 は form action の完了後に入力欄をリセットするため、
// 保存エラー時に入力内容が消えないよう onSubmit から action を呼ぶ。
export function submitWithoutReset(action: (data: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // 押されたボタンの name/value も含める（「確認する」「取り込む」など）
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    startTransition(() => action(data));
  };
}
