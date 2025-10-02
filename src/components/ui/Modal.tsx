"use client";
import React, { useEffect, useRef } from "react";

interface ModalProps {
	open: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	actions?: React.ReactNode;
	widthClass?: string; // e.g. "max-w-md"
	hideCloseButton?: boolean;
	closeOnBackdrop?: boolean;
	ariaLabel?: string; // fallback when no title
}

export default function Modal({
	open,
	onClose,
	title,
	children,
	actions,
	widthClass = "max-w-md",
	hideCloseButton = false,
	closeOnBackdrop = true,
	ariaLabel,
}: ModalProps) {
	const dialogRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	useEffect(() => {
		if (open && dialogRef.current) dialogRef.current.focus();
	}, [open]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-[150] flex items-center justify-center"
			aria-modal="true"
			role="dialog"
			aria-label={title || ariaLabel || "Modal"}
		>
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn opacity-100"
				onClick={() => closeOnBackdrop && onClose()}
			/>
			{/* Dialog */}
			<div
				ref={dialogRef}
				tabIndex={-1}
				className={`relative w-full ${widthClass} mx-4 bg-readowl-purple-extradark/90 border border-readowl-purple-light/20 shadow-2xl p-6 text-readowl-purple-extralight animate-scaleIn`}
			>
				{!hideCloseButton && (
					<button
						onClick={onClose}
						aria-label="Fechar"
						className="absolute top-3 right-3 text-readowl-purple-extralight/70 hover:text-white transition"
					>
						✕
					</button>
				)}
				{title && <h2 className="text-lg font-semibold mb-4 text-white">{title}</h2>}
				<div className="text-sm mb-5 text-readowl-purple-extralight/90 space-y-3">{children}</div>
				{actions && <div className="flex gap-3 justify-end">{actions}</div>}
			</div>
			<style jsx global>{`
				@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
				@keyframes scaleIn { from { opacity:0; transform: translateY(8px) scale(.96);} to { opacity:1; transform: translateY(0) scale(1);} }
				.animate-fadeIn { animation: fadeIn .4s ease forwards; }
				.animate-scaleIn { animation: scaleIn .45s cubic-bezier(.16,.84,.44,1) forwards; }
			`}</style>
		</div>
	);
}

