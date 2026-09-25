import { formatDate } from "./dates";
import { SCHOOL_NAME } from "./constants";

// 運用マニュアル「５．期限超過時の対応」: 期限切れを保護者へ自動メールで通知する
export function expiryNoticeMail(p: {
  guardianName: string;
  code: string;
  campusName: string;
  deadline: Date;
}): { subject: string; text: string } {
  return {
    subject: `【${SCHOOL_NAME}】紹介特典のお申込みについて（入力期限切れのお知らせ）`,
    text: `${p.guardianName} 様

${SCHOOL_NAME}です。紹介特典のお申込みをいただき、ありがとうございます。

誠に恐れ入りますが、ご入力いただいた招待コード（${p.code}）は
入力期限（${formatDate(p.deadline)}まで、カード配布から1か月以内）を過ぎているため、
今回のお申込みは無効となりました。

ご不明な点やご事情がございましたら、${p.campusName}までお問い合わせください。

※本メールは送信専用です。ご返信いただいてもお答えできません。

${SCHOOL_NAME}`,
  };
}
