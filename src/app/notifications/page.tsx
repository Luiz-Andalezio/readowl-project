"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/ui/navbar/Navbar";
import { BreadcrumbAuto } from "@/components/ui/navbar/Breadcrumb";
import NotificationCard, { Notification } from "@/components/ui/notifications/NotificationCard";
import { CheckSquare, Trash2 } from "lucide-react";

// Simulação: buscar notificações do backend
function fetchNotifications(): Promise<Notification[]> {
    // Busca real das notificações do backend
    return fetch("/api/notifications")
        .then(res => res.json())
        .then((arr) => {
            if (!Array.isArray(arr)) return [];
            return arr.map((n: any) => ({
                id: n.id,
                type: (n.type || "").toLowerCase(),
                bookCoverUrl: n.bookCoverUrl || "",
                bookTitle: n.bookTitle || "",
                chapterTitle: n.chapterTitle,
                authorName: n.authorName || n.commenterName || "",
                commenterName: n.commenterName,
                commentContent: n.commentContent,
                replyContent: n.replyContent,
                originalComment: n.originalComment,
                chapterSnippet: n.chapterSnippet,
                createdAt: n.createdAt,
                checked: false,
            }));
        });
}

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [showModal, setShowModal] = useState(false);
    const [deleteAll, setDeleteAll] = useState(false);

    useEffect(() => {
        fetchNotifications().then(setNotifications);
    }, []);

    const handleCheck = (id: string, checked: boolean) => {
        setSelected(prev => {
            const next = new Set(prev);
            checked ? next.add(id) : next.delete(id);
            return next;
        });
    };
    const handleDelete = (id: string) => {
        setSelected(new Set([id]));
        setDeleteAll(false);
        setShowModal(true);
    };
    const handleDeleteAll = () => {
        setDeleteAll(true);
        setShowModal(true);
    };
    const confirmDelete = () => {
        if (deleteAll) {
            setNotifications(n => n.filter(noti => !selected.has(noti.id)));
        } else {
            setNotifications(n => n.filter(noti => !selected.has(noti.id)));
        }
        setSelected(new Set());
        setShowModal(false);
        setDeleteAll(false);
    };
    const cancelDelete = () => {
        setShowModal(false);
        setDeleteAll(false);
    };
    const handleSelectAll = () => {
        setSelected(new Set(notifications.map(n => n.id)));
    };

    return (
        <>
            <Navbar />
            <div className="w-full flex justify-center mt-14 sm:mt-16">
                <BreadcrumbAuto anchor="static" base="/home" labelMap={{ notifications: "Notificações" }} />
            </div>
            <main className="min-h-screen flex flex-col items-center bg-readowl-purple-extralight/30">
                <div className="w-full max-w-3xl mx-auto px-2 py-6">
                    <div className="flex justify-end gap-2 mb-4">
                        <button
                            className="flex items-center gap-2 px-3 py-2 rounded bg-white shadow hover:bg-readowl-purple-extralight/60 transition text-readowl-purple-extradark font-semibold"
                            onClick={handleSelectAll}
                            aria-label="Selecionar tudo"
                        >
                            <CheckSquare size={20} /> Selecionar tudo
                        </button>
                        <button
                            className="flex items-center gap-2 px-3 py-2 rounded bg-red-100 shadow hover:bg-red-200 transition text-red-700 font-semibold"
                            onClick={handleDeleteAll}
                            disabled={selected.size === 0}
                            aria-label="Excluir selecionados"
                        >
                            <Trash2 size={20} /> Excluir selecionados
                        </button>
                    </div>
                    {/* Render cards de notificações */}
                    <div>
                        {notifications.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">Nenhuma notificação encontrada.</div>
                        ) : (
                            notifications.map(noti => (
                                <NotificationCard
                                    key={noti.id}
                                    notification={{ ...noti, checked: selected.has(noti.id) }}
                                    onCheck={handleCheck}
                                    onDelete={handleDelete}
                                    onClick={() => {/* Redirecionar para obra/capítulo/comentário */}}
                                />
                            ))
                        )}
                    </div>
                </div>
                {/* Modal de confirmação */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn">
                        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                            <h2 className="text-lg font-bold mb-2 text-readowl-purple-extradark">Confirmar exclusão</h2>
                            <p className="mb-4 text-gray-700">
                                Tem certeza que deseja excluir {deleteAll ? "todas as notificações selecionadas" : "esta notificação"}? Essa ação não pode ser desfeita.
                            </p>
                            <div className="flex justify-end gap-2">
                                <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold" onClick={cancelDelete}>Cancelar</button>
                                <button className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold" onClick={confirmDelete}>Excluir</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}