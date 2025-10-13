"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Anchor = "static" | "top-left" | "top-center";
type Tone = "dark" | "light";

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
  anchor?: Anchor; // "top-left" will place it on the top-left corner of the parent container; "top-center" centers it
  showHome?: boolean; // optionally prefix with Home
  homeHref?: string;
  tone?: Tone; // visual tone for text colors
};


export function Breadcrumb({ items, className = "", anchor = "static", showHome = false, homeHref = "/home", tone = "dark" }: BreadcrumbProps) {
  const list: BreadcrumbItem[] = showHome ? [{ label: "Início", href: homeHref }, ...items] : items;
  const basePos =
    anchor === "top-left"
      ? "absolute top-2 left-3"
      : anchor === "top-center"
      ? "absolute top-2 left-1/2 -translate-x-1/2"
      : "";
  const isLight = tone === "light";
  const textBase = isLight ? "text-readowl-purple-extradark" : "text-readowl-purple-extralight";
  const textMuted = isLight ? "text-readowl-purple-extradark/80" : "text-readowl-purple-extralight/80";
  const sepColor = isLight ? "text-readowl-purple-extradark/70" : "text-readowl-purple-extralight/70";
  const linkHover = isLight ? "hover:text-readowl-purple-dark" : "hover:text-white";
  return (
    <nav aria-label="Breadcrumb" className={`${basePos} ${className}`}>
      <ol className={`m-4 flex flex-wrap items-center break-words leading-tight text-sm ${textBase}`}>
        {list.map((item, idx) => {
          const isLast = idx === list.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={`break-words ${linkHover} transition-colors underline-offset-2 hover:underline`}
                >
                  {item.label}
                </Link>
              ) : (
                <span className={`break-words ${textMuted}`} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden>
                  <svg
                    className={`w-3.5 h-3.5 ${sepColor} mx-2`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Helper: generate crumbs from pathname. You can provide a label map to prettify segments.
export function BreadcrumbAuto({
  base = "/home",
  labelMap = {},
  className = "",
  anchor = "static",
  tone = "dark",
}: {
  base?: string;
  labelMap?: Record<string, string>;
  className?: string;
  anchor?: Anchor;
  tone?: Tone;
}) {
  const pathname = usePathname() || base;
  // Simple error-context detection: 403, generic error, or Next.js not-found fallback
  const isErrorContext = (() => {
    if (!pathname) return false;
    const direct = pathname === "/403" || pathname === "/erro" || pathname === "/_not-found";
    if (direct) return true;
    const segs = pathname.replace(/^\/+/, "").split("/").filter(Boolean);
    return segs.includes("403") || segs.includes("erro") || segs.includes("_not-found");
  })();

  if (isErrorContext) {
    // Render a single trail pointing to an error context, with Home prefix
    return <Breadcrumb items={[{ label: "Erro" }]} showHome homeHref={base} className={className} anchor={anchor} tone={tone} />;
  }
  const segments = pathname
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean);

  const items: BreadcrumbItem[] = [];
  let acc = "";
  segments.forEach((seg, i) => {
    acc += `/${seg}`;
    const isLast = i === segments.length - 1;
    const label = labelMap[seg] || deslug(seg);
    items.push({ label, href: isLast ? undefined : acc });
  });

  return <Breadcrumb items={items} showHome homeHref={base} className={className} anchor={anchor} tone={tone} />;
}

function deslug(s: string) {
  try {
    const label = decodeURIComponent(s).replace(/-/g, " ");
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return s;
  }
}

export default Breadcrumb;
