export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";
  // モバイル端末（スマホ・タブレット）かどうかを簡易判定
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  const url = new URL(request.url);

  // ルートパス "/" または "/index.html" へのアクセスを監視
  if (url.pathname === "/" || url.pathname === "/index.html") {
    if (!isMobile) {
      // PCアクセスの場合は、同一URLのまま裏で desktop.html を返す
      return context.rewrite("/desktop.html");
    }
  }

  // モバイルアクセス、またはその他のリソースはそのまま通常の処理を続行
  return context.next();
};
