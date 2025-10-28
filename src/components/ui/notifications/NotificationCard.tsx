"use client";
import { Trash2, MessageCircle, Reply, BookOpen, FileText, CheckSquare, Square } from "lucide-react";
import React from "react";

export type NotificationType =
  | "book_comment"
  | "chapter_comment"
  | "comment_reply"
  | "new_chapter";

export interface Notification {
  id: string;
  type: NotificationType;
  bookCoverUrl: string;
  bookTitle: string;
  chapterTitle?: string;
  authorName: string;
  commenterName?: string;
  commentContent?: string;
  replyContent?: string;
  originalComment?: string;
  chapterSnippet?: string;
  createdAt: string; // ISO string
  checked: boolean;
}

const typeConfig: Record<NotificationType, {
  icon: React.ReactNode;
  color: string;
  title: (n: Notification) => string;
  subtitle?: (n: Notification) => string;
  snippet?: (n: Notification) => string | undefined;
}> = {
  book_comment: {
    icon: <MessageCircle className="text-readowl-purple-medium" size={22} />,
    color: "border-readowl-purple-medium",
    title: n => `Novo comentário na sua obra ${n.bookTitle}`,
    subtitle: n => `De: ${n.commenterName}`,
    snippet: n => n.commentContent,
  },
  chapter_comment: {
    icon: <FileText className="text-readowl-purple-medium" size={22} />,
    color: "border-readowl-purple-medium",
    title: n => `Novo comentário no capítulo ${n.chapterTitle} da sua obra ${n.bookTitle}`,
    subtitle: n => `De: ${n.commenterName}`,
    snippet: n => n.commentContent,
  },
  comment_reply: {
    icon: <Reply className="text-readowl-purple-medium" size={22} />,
    color: "border-readowl-purple-medium",
    title: n => n.chapterTitle
      ? `Nova resposta em seu comentário no capítulo ${n.chapterTitle} da obra ${n.bookTitle}`
      : `Nova resposta em seu comentário na obra ${n.bookTitle}`,
    subtitle: n => `De: ${n.commenterName}`,
    snippet: n => n.replyContent,
  },
  new_chapter: {
    icon: <BookOpen className="text-readowl-purple-medium" size={22} />,
    color: "border-readowl-purple-medium",
    title: n => `Novo capítulo de ${n.bookTitle}`,
    subtitle: n => `De: ${n.authorName}`,
    snippet: n => n.chapterSnippet,
  },
};

interface Props {
  notification: Notification;
  onClick?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCheck?: (id: string, checked: boolean) => void;
}

export default function NotificationCard({ notification, onClick, onDelete, onCheck }: Props) {
  // Função para extrair texto limpo de HTML
  function stripHtml(html?: string) {
    if (!html) return "";
    if (typeof window === "undefined") return html;
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }

  const config = typeConfig[notification.type];
  return (
    <div
      className={`flex items-center bg-white rounded-lg shadow-md mb-4 p-4 border-l-4 ${config.color} transition hover:shadow-lg hover:bg-readowl-purple-extralight/40 cursor-pointer group`}
      style={{ minHeight: 96 }}
      onClick={() => onClick?.(notification.id)}
      tabIndex={0}
      role="button"
      aria-label={config.title(notification)}
    >
      {/* Left: Book cover */}
      {notification.bookCoverUrl && notification.bookCoverUrl.trim() !== "" ? (
        <img
          src={notification.bookCoverUrl}
          alt={`Capa de ${notification.bookTitle}`}
          className="w-16 h-20 object-cover rounded-md mr-4 border border-readowl-purple-extralight shadow-sm"
        />
      ) : (
        <div className="w-16 h-20 rounded-md mr-4 bg-readowl-purple-extralight flex items-center justify-center border border-readowl-purple-extralight shadow-sm">
          <BookOpen className="text-readowl-purple-medium" size={32} />
        </div>
      )}
      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="font-bold text-readowl-purple-extradark text-base md:text-lg truncate">
            {config.title(notification)}
          </span>
        </div>
        {config.subtitle && (
          <div className="text-sm text-readowl-purple-medium mt-1">
            {config.subtitle(notification)}
          </div>
        )}
        {notification.originalComment && (
          <div className="text-xs text-gray-500 italic mt-1 truncate">
            “{stripHtml(notification.originalComment)}”
          </div>
        )}
        {config.snippet && (
          <div className="text-sm text-gray-700 mt-1 truncate">
            {stripHtml(config.snippet(notification))}
          </div>
        )}
      </div>
      {/* Right: Date, check, delete */}
      <div className="flex flex-col items-end gap-2 ml-4">
        <span className="text-xs text-gray-400 mb-1">
          {new Date(notification.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
        </span>
        <button
          className="p-1 rounded hover:bg-readowl-purple-extralight/60 transition"
          aria-label={notification.checked ? "Desmarcar" : "Selecionar"}
          onClick={e => { e.stopPropagation(); onCheck?.(notification.id, !notification.checked); }}
        >
          {notification.checked ? <CheckSquare size={20} className="text-readowl-purple-medium" /> : <Square size={20} className="text-gray-400" />}
        </button>
        <button
          className="p-1 rounded hover:bg-red-100 transition"
          aria-label="Excluir notificação"
          onClick={e => { e.stopPropagation(); onDelete?.(notification.id); }}
        >
          <Trash2 size={20} className="text-red-400 group-hover:text-red-600 transition" />
        </button>
      </div>
    </div>
  );
}
