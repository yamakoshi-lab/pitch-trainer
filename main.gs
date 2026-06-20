// --- POSTリクエストの受け口（データの書き込み） ---
function doPost(e) {
  try {
    // フロントエンドから送られてきたJSONペイロードを解読
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // スプレッドシートに記録する（1行の配列として追加）
    // カラム構成: [A: タイムスタンプ, B: ハッシュ化ユーザーID, C: 総誤差, D: 総反応時間(ms), E: 1問ごとの詳細データ(JSON文字列)]
    sheet.appendRow([
      new Date(),
      data.userId,
      data.totalScore, // 総誤差
      data.totalTime,  // 総反応時間 (ms)
      JSON.stringify(data.details) // 解析用の生データを文字列化して保存
    ]);
    
    // 成功レスポンスを返す（CORSエラー回避）
    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- GETリクエストの受け口（グラフ用データの返却） ---
function doGet(e) {
  // URLのパラメータからユーザーのハッシュIDを取得 (?userId=xxx)
  const userId = e.parameter.userId;
  
  if (!userId) {
    return ContentService.createTextOutput(JSON.stringify({error: "No userId provided"}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const results = [];
  
  // スプレッドシートの全行を走査し、IDが一致する過去データを抽出（計算量 O(N)）
  // 1行目がヘッダー（見出し）の場合は、i = 1 からスタートしてください。
  for (let i = 0; i < data.length; i++) {
    if (data[i][1] === userId) {
      results.push({
        timestamp: data[i][0],
        score: data[i][2],            // 総誤差
        time: data[i][3] !== undefined ? data[i][3] : 0  // 総反応時間 (ms)
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(results))
    .setMimeType(ContentService.MimeType.JSON);
}
