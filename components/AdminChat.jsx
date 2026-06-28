"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDocuments } from "@/services/documentService";

const quickReplies = [
  "Bạn xem giúp mình tài liệu này nhé",
  "Mình cần file bài tập lớn",
  "Bạn có slide buổi học hôm nay không?",
];

function formatFileSize(bytes = 0) {
  const size = Number(bytes || 0);

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminChat() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [loadError, setLoadError] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "friend",
      name: "Minh Anh",
      text: "Bạn có thể gửi tin nhắn hoặc đính kèm tài liệu học tập ở đây.",
      time: "09:00",
    },
    {
      id: "sample-file",
      sender: "friend",
      name: "Minh Anh",
      text: "Mình gửi thử mẫu file để bạn thấy luồng chia sẻ.",
      file: {
        name: "cloud-computing-notes.pdf",
        sizeLabel: "2.40 MB",
      },
      time: "09:02",
    },
  ]);
  const [isReplying, setReplying] = useState(false);

  const userInitial = useMemo(
    () => user?.fullName?.trim()?.slice(0, 1).toUpperCase() || "U",
    [user],
  );
  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === selectedDocumentId) || null,
    [documents, selectedDocumentId],
  );

  useEffect(() => {
    let isMounted = true;

    getDocuments()
      .then((items) => {
        if (!isMounted) return;
        setDocuments(items);
      })
      .catch((error) => {
        if (!isMounted) return;
        setLoadError(error.message || "Không thể tải danh sách tài liệu.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function getShareLink(doc) {
    if (typeof window === "undefined" || !doc?.s3Key) return "";

    const params = new URLSearchParams({
      url: doc.s3Key,
      name: doc.name || "tai-lieu",
      type: doc.fileType || "",
      size: doc.sizeLabel || "",
    });

    return `${window.location.origin}/share?${params.toString()}`;
  }

  function buildMessage(text = message) {
    const cleanText = text.trim();

    if (!cleanText && !attachedFile && !selectedDocument) return null;

    return {
      id: `user-${Date.now()}`,
      sender: "user",
      name: user?.fullName || "Bạn",
      recipient: recipientEmail.trim(),
      text:
        cleanText ||
        (selectedDocument
          ? "Đã gửi link tài liệu đã upload."
          : "Đã gửi một tài liệu."),
      file: selectedDocument
        ? {
            name: selectedDocument.name,
            sizeLabel: selectedDocument.sizeLabel,
            shareUrl: getShareLink(selectedDocument),
            source: "library",
          }
        : attachedFile
          ? {
              name: attachedFile.name,
              sizeLabel: formatFileSize(attachedFile.size),
              source: "local",
            }
          : null,
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }

  function sendMessage(text = message) {
    if (isReplying) return;

    const nextMessage = buildMessage(text);
    if (!nextMessage) return;

    setMessages((current) => [...current, nextMessage]);
    setMessage("");
    setAttachedFile(null);
    setSelectedDocumentId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setReplying(true);

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `friend-${Date.now()}`,
          sender: "friend",
          name: "Minh Anh",
          text: nextMessage.file
            ? "Mình nhận được tài liệu rồi. Nếu là link CloudLearn thì mình có thể mở xem hoặc tải về ngay."
            : "Mình nhận được tin nhắn rồi.",
          time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setReplying(false);
    }, 800);
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  function handleFileChange(event) {
    setAttachedFile(event.target.files?.[0] || null);
  }

  return (
    <section className="rounded-[28px] border border-apple-hairline bg-white shadow-sm xl:col-span-3">
      <div className="border-b border-apple-hairline p-6">
        <p className="text-sm font-bold uppercase tracking-wide text-apple-primary">
          Tin nhắn tài liệu
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-apple-text">
              Chat và gửi file cho bạn học
            </h2>
            <p className="mt-1 text-sm text-apple-muted">
              Gửi tin nhắn, chọn tài liệu đã upload và chia sẻ link xem/tải
              cho tài khoản khác.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#EAF7EA] px-3 py-1 text-xs font-bold text-apple-success">
            <span className="h-2 w-2 rounded-full bg-apple-success" />
            Bạn học đang online
          </span>
        </div>
      </div>

      <div className="max-h-[460px] space-y-4 overflow-y-auto bg-apple-secondary p-5">
        {messages.map((item) => {
          const isUser = item.sender === "user";
          return (
            <div
              key={item.id}
              className={`flex items-end gap-3 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-apple-dark text-xs font-bold text-white">
                  MA
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-[22px] px-4 py-3 text-sm shadow-sm ${
                  isUser
                    ? "bg-apple-primary text-white"
                    : "border border-apple-hairline bg-white text-apple-text"
                }`}
              >
                <p className="text-xs font-bold opacity-80">{item.name}</p>
                {item.recipient && (
                  <p className="mt-1 text-[11px] opacity-75">
                    Gửi đến: {item.recipient}
                  </p>
                )}
                <p className="mt-1 leading-6">{item.text}</p>
                {item.file && (
                  <div
                    className={`mt-3 rounded-2xl px-3 py-2 ${
                      isUser ? "bg-white/15" : "bg-apple-secondary"
                    }`}
                  >
                    <p className="truncate font-bold">{item.file.name}</p>
                    <p
                      className={`mt-0.5 text-xs ${
                        isUser ? "text-white/75" : "text-apple-muted"
                      }`}
                    >
                      {item.file.sizeLabel} ·{" "}
                      {item.file.source === "library"
                        ? "link CloudLearn"
                        : "file đính kèm local"}
                    </p>
                    {item.file.shareUrl && (
                      <a
                        href={item.file.shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                          isUser
                            ? "bg-white text-apple-primary"
                            : "bg-white text-apple-primary"
                        }`}
                      >
                        Mở / tải tài liệu
                      </a>
                    )}
                  </div>
                )}
                <p
                  className={`mt-1 text-[11px] ${
                    isUser ? "text-white/75" : "text-apple-muted"
                  }`}
                >
                  {item.time}
                </p>
              </div>
              {isUser && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF4FF] text-xs font-bold text-apple-primary">
                  {userInitial}
                </div>
              )}
            </div>
          );
        })}

        {isReplying && (
          <div className="flex items-end gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-apple-dark text-xs font-bold text-white">
              MA
            </div>
            <div className="rounded-[22px] border border-apple-hairline bg-white px-4 py-3 text-sm text-apple-muted shadow-sm">
              Đang nhập...
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => sendMessage(reply)}
              disabled={isReplying}
              className="rounded-full border border-apple-hairline bg-white px-4 py-2 text-xs font-bold text-apple-text transition hover:bg-apple-secondary disabled:cursor-not-allowed disabled:text-apple-muted"
            >
              {reply}
            </button>
          ))}
        </div>

        {attachedFile && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-apple-secondary px-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-bold text-apple-text">
                {attachedFile.name}
              </p>
              <p className="text-xs text-apple-muted">
                {formatFileSize(attachedFile.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAttachedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="rounded-full border border-apple-hairline bg-white px-3 py-1.5 text-xs font-bold text-apple-error"
            >
              Bỏ file
            </button>
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <label
              className="mb-1.5 block text-sm font-semibold text-apple-text"
              htmlFor="recipient-email"
            >
              Tài khoản nhận
            </label>
            <input
              id="recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder="email người nhận..."
              className="w-full rounded-2xl border border-apple-hairline bg-white px-4 py-3 text-sm text-apple-text outline-none transition placeholder:text-[#A1A1A6] focus:border-apple-primary focus:ring-2 focus:ring-[#0071E3]/20"
            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-sm font-semibold text-apple-text"
              htmlFor="library-document"
            >
              Gửi tài liệu đã upload
            </label>
            <select
              id="library-document"
              value={selectedDocumentId}
              onChange={(event) => {
                setSelectedDocumentId(event.target.value);
                setAttachedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="w-full rounded-2xl border border-apple-hairline bg-white px-4 py-3 text-sm text-apple-text outline-none transition focus:border-apple-primary focus:ring-2 focus:ring-[#0071E3]/20"
            >
              <option value="">Không chọn tài liệu</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
            {loadError && (
              <p className="mt-2 text-xs text-apple-error">{loadError}</p>
            )}
          </div>
        </div>

        <form className="flex flex-col gap-3 lg:flex-row" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="peer-chat-message">
            Nhập tin nhắn
          </label>
          <input
            id="peer-chat-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Nhập tin nhắn..."
            disabled={isReplying}
            className="min-h-12 flex-1 rounded-full border border-apple-hairline bg-white px-5 py-3 text-sm text-apple-text outline-none transition placeholder:text-[#A1A1A6] focus:border-apple-primary focus:ring-2 focus:ring-[#0071E3]/20 disabled:cursor-not-allowed disabled:bg-apple-secondary"
          />
          <input
            ref={fileInputRef}
            type="file"
            onChange={(event) => {
              handleFileChange(event);
              setSelectedDocumentId("");
            }}
            disabled={isReplying}
            className="hidden"
            id="peer-chat-file"
          />
          <label
            htmlFor="peer-chat-file"
            className="cursor-pointer rounded-full border border-apple-hairline bg-white px-5 py-3 text-center text-sm font-bold text-apple-text transition hover:bg-apple-secondary"
          >
            Đính kèm
          </label>
          <button
            type="submit"
            disabled={
              (!message.trim() && !attachedFile && !selectedDocument) ||
              isReplying
            }
            className="rounded-full bg-apple-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-apple-link active:bg-[#0055B8] disabled:cursor-not-allowed disabled:bg-apple-hairline"
          >
            Gửi
          </button>
        </form>
      </div>
    </section>
  );
}
