function getSafeFileName(fileName = "") {
  return fileName.trim() || "tai-lieu";
}

function isAllowedDocumentUrl(fileUrl = "") {
  try {
    const parsedUrl = new URL(fileUrl);

    return (
      parsedUrl.protocol.startsWith("http") &&
      parsedUrl.pathname.includes("/storage/v1/object/public/documents/")
    );
  } catch {
    return false;
  }
}

export default function SharePage({ searchParams }) {
  const fileUrl = searchParams?.url || "";
  const fileName = getSafeFileName(searchParams?.name || "");
  const fileType = searchParams?.type || "Tài liệu";
  const fileSize = searchParams?.size || "";
  const canOpen = isAllowedDocumentUrl(fileUrl);
  const downloadParams = new URLSearchParams({
    url: fileUrl,
    name: fileName,
  });

  return (
    <main className="min-h-screen bg-apple-secondary px-5 py-10">
      <section className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="rounded-[28px] border border-apple-hairline bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-apple-primary">
            CloudLearn Share Link
          </p>
          <h1 className="mt-3 text-2xl font-bold text-apple-text md:text-3xl">
            {canOpen ? fileName : "Link tài liệu không hợp lệ"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-apple-muted">
            Người có link này có thể xem trước hoặc tải file về máy. Không cần
            đăng nhập để truy cập tài liệu được chia sẻ bằng link.
          </p>
        </div>

        <div className="rounded-[28px] border border-apple-hairline bg-white p-6 shadow-sm">
          {canOpen ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Tên file" value={fileName} />
                <InfoRow label="Loại file" value={fileType || "Không rõ"} />
                <InfoRow label="Dung lượng" value={fileSize || "Không rõ"} />
                <InfoRow label="Quyền truy cập" value="Ai có link đều xem được" />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-apple-hairline bg-white px-5 py-3 text-center text-sm font-bold text-apple-text transition hover:border-apple-primary hover:bg-[#EAF4FF]"
                >
                  Xem file
                </a>
                <a
                  href={`/api/documents/download?${downloadParams.toString()}`}
                  className="rounded-full bg-apple-primary px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-apple-link"
                >
                  Tải về
                </a>
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-[#FFF2F2] px-4 py-3 text-sm text-apple-error">
              Link này thiếu đường dẫn file hoặc không trỏ tới bucket documents
              của CloudLearn.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-apple-secondary px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-apple-muted">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-apple-text">
        {value}
      </p>
    </div>
  );
}
