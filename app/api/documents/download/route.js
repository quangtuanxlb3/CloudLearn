function getDownloadName(fileName) {
  return (fileName || "tai-lieu")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/[\r\n]/g, "")
    .trim();
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get("url");
  const fileName = getDownloadName(searchParams.get("name"));

  if (!fileUrl) {
    return Response.json(
      { message: "Thiếu đường dẫn tài liệu." },
      { status: 400 },
    );
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(fileUrl);
  } catch {
    return Response.json(
      { message: "Đường dẫn tài liệu không hợp lệ." },
      { status: 400 },
    );
  }

  const isStorageFile =
    parsedUrl.protocol.startsWith("http") &&
    parsedUrl.pathname.includes("/storage/v1/object/public/documents/");

  if (!isStorageFile) {
    return Response.json(
      { message: "Chỉ cho phép tải file trong bucket documents." },
      { status: 400 },
    );
  }

  const upstream = await fetch(parsedUrl);

  if (!upstream.ok || !upstream.body) {
    return Response.json(
      { message: "Không thể tải tài liệu từ Supabase." },
      { status: upstream.status || 502 },
    );
  }

  const encodedName = encodeURIComponent(fileName);
  const asciiName = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  const headers = new Headers({
    "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
    "Content-Type":
      upstream.headers.get("content-type") || "application/octet-stream",
    "Cache-Control": "private, no-store",
  });

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new Response(upstream.body, { headers });
}
