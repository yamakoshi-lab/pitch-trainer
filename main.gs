// --- POSTリクエストの受け口（データの書き込み） ---
function doPost(e) {
  try {
    // フロントエンドから送られてきたJSONペイロードを解読
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // スプレッドシートに記録する（1行の配列として追加）
    // カラム構成: 
    // [A: タイムスタンプ, B: ハッシュ化ユーザーID, C: 絶対音感 誤差, D: 絶対音感 反応時間(ms), E: 相対音感 誤差, F: 相対音感 反応時間(ms), G: 詳細データ(JSON)]
    sheet.appendRow([
      new Date(),
      data.userId,
      data.absError,  // 絶対音感 誤差
      data.absTime,   // 絶対音感 反応時間 (ms)
      data.relError,  // 相対音感 誤差
      data.relTime,   // 相対音感 反応時間 (ms)
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
  const userId = e.parameter.userId;
  
  if (!userId) {
    return ContentService.createTextOutput(JSON.stringify({error: "No userId provided"}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const results = [];
  
  // スプレッドシートの全行を走査し、IDが一致する過去データを抽出
  for (let i = 0; i < data.length; i++) {
    if (data[i][1] === userId) {
      results.push({
        timestamp: data[i][0],
        absError: data[i][2] !== undefined ? data[i][2] : 0,
        absTime: data[i][3] !== undefined ? data[i][3] : 0,
        relError: data[i][4] !== undefined ? data[i][4] : 0,
        relTime: data[i][5] !== undefined ? data[i][5] : 0
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(results))
    .setMimeType(ContentService.MimeType.JSON);
}
