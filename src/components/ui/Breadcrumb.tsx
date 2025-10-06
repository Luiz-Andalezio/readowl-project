"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Anchor = "static" | "top-left" | "top-center";

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
  anchor?: Anchor; // "top-left" will place it on the top-left corner of the parent container; "top-center" centers it
  showHome?: boolean; // optionally prefix with Home
  homeHref?: string;
};

const SEP = (
  <svg
    className="w-3.5 h-3.5 text-readowl-purple-extralight/70 mx-2"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export function Breadcrumb({ items, className = "", anchor = "static", showHome = false, homeHref = "/home" }: BreadcrumbProps) {
  const list: BreadcrumbItem[] = showHome ? [{ label: "Início", href: homeHref }, ...items] : items;
  const basePos =
    anchor === "top-left"
      ? "absolute top-2 left-3"
      : anchor === "top-center"
      ? "absolute top-2 left-1/2 -translate-x-1/2"
      : "";
  return (
    <nav aria-label="Breadcrumb" className={`${basePos} ${className}`}>
      <ol className="m-4 flex items-center text-sm text-readowl-purple-extralight">
        {list.map((item, idx) => {
          const isLast = idx === list.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-white transition-colors underline-offset-2 hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-readowl-purple-extralight/80" aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <span aria-hidden>{SEP}</span>}
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
}: {
  base?: string;
  labelMap?: Record<string, string>;
  className?: string;
  anchor?: Anchor;
}) {
  const pathname = usePathname() || base;
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

  return <Breadcrumb items={items} showHome homeHref={base} className={className} anchor={anchor} />;
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
