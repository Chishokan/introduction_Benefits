/**
 * 紹介特典アプリ → 社用 Gmail 送信用の Web アプリ
 *
 * 設定手順は gas/README.md を参照。
 * スクリプト プロパティ:
 *   MAIL_SECRET  アプリの環境変数 GAS_MAIL_SECRET と同じ値（必須）
 *   SENDER_NAME  差出人名（任意。既定: 智翔館）
 *   REPLY_TO     返信先アドレス（任意）
 */

function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty('MAIL_SECRET');
    var data = JSON.parse(e.postData.contents);

    if (!secret || data.secret !== secret) {
      return json_({ ok: false, error: 'unauthorized' });
    }
    if (!isEmail_(data.to) || !data.subject || !data.body) {
      return json_({ ok: false, error: 'invalid request' });
    }

    var options = { name: props.getProperty('SENDER_NAME') || '智翔館' };
    var replyTo = props.getProperty('REPLY_TO');
    if (replyTo) options.replyTo = replyTo;

    GmailApp.sendEmail(data.to, String(data.subject), String(data.body), options);
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err) });
  }
}

function isEmail_(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** 動作確認用: エディタから実行すると自分宛てにテストメールを送る（初回は権限の承認が必要） */
function testSend() {
  var me = Session.getActiveUser().getEmail();
  GmailApp.sendEmail(me, '【テスト】紹介特典メール送信', 'GAS からの送信テストです。', { name: '智翔館' });
}
