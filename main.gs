// 【GAS側】スプレッドシートに紐付いたスクリプトエディタに記述
function doPost(e) {
  // 1. CORS対応（異なるOriginからのアクセスを許可する物理的ヘッダー）
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    // 2. パケットのパースと変数の展開
    const data = JSON.parse(e.postData.contents);
    const username = data.username;
    const passHash = data.passHash;
    const score = data.score;
    const nonce = data.nonce;

    // 3. PoW（総当たり攻撃防止）の検証フェーズ（計算量 O(1)）
    // ※今回はデバッグ用に難易度を「先頭に '000'」としています。
    const checkString = username + passHash + score + nonce;
    const checkHash = computeSHA256(checkString);
    if (!checkHash.startsWith("000")) {
      return buildResponse(400, "PoW Verification Failed. Invalid Nonce.", headers);
    }

    // 4. スプレッドシート・インジェクションのサニタイズ（計算量 O(N)）
    const safeUsername = sanitize(username);
    
    // 5. スプレッドシートへの物理的書き込み
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([new Date(), safeUsername, passHash, score, nonce, checkHash]);

    return buildResponse(200, "Log successfully appended.", headers);

  } catch (error) {
    return buildResponse(500, "Server Error: " + error.toString(), headers);
  }
}

// OPTIONSリクエスト（プリフライト通信）への自動応答
function doOptions(e) {
  return buildResponse(200, "Preflight OK", {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
}

// レスポンス構築用ヘルパー関数
function buildResponse(code, message, headers) {
  const output = ContentService.createTextOutput(JSON.stringify({ status: code, message: message }));
  for (let key in headers) {
    // ContentServiceはヘッダーの完全な制御ができない仕様（リダイレクトが発生する）ため、
    // GASの仕様に合わせた最低限の出力を構築します。
  }
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// サニタイズ関数（数式トリガーの排除）
function sanitize(str) {
  if (typeof str !== 'string') return '';
  // スプレッドシートで数式として評価される文字で始まる場合、先頭に「'」を付与して文字列化
  if (str.match(/^[=\+\-@]/)) {
    return "'" + str;
  }
  return str;
}

// GAS内でのSHA-256計算関数
function computeSHA256(input) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  return rawHash.map(function(byte) {
    const v = (byte < 0) ? 256 + byte : byte;
    return ("0" + v.toString(16)).slice(-2);
  }).join("");
}
