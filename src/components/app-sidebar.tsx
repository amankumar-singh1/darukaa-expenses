"use client";

import {
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  ScanLine,
  Settings,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/logo";
import { cn, initials } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "Expenses",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/expenses", label: "Expenses", icon: ReceiptText },
      { href: "/categories", label: "Categories", icon: Tags },
    ],
  },
  {
    label: "Device Operations",
    items: [
      { href: "/devices", label: "Devices", icon: QrCode },
      { href: "/devices/scan", label: "Scan Device", icon: ScanLine },
      { href: "/devices/labels", label: "QR Labels", icon: Printer },
    ],
  },
  {
    label: "Projects",
    items: [{ href: "/projects", label: "Projects", icon: FolderKanban }],
  },
  {
    label: null,
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
] as const;

const ALL_ITEMS = NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => item),
);

// Longest matching href wins, so /devices/scan doesn't also light up /devices.
function activeHref(pathname: string) {
  return ALL_ITEMS.filter(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function NavLink({
  item,
  active,
  variant,
}: {
  item: (typeof ALL_ITEMS)[number];
  active: boolean;
  variant: "desktop" | "mobile";
}) {
  const Icon = item.icon;

  if (variant === "mobile") {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex w-16 flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-medium",
          active ? "text-brand-700" : "text-ink/45",
        )}
      >
        <Icon className="h-5 w-5" />
        {item.label}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
        active
          ? "bg-white/10 text-lime-300"
          : "text-white/65 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

// Mobile bottom bar: the two money tabs, the add-expense FAB, then devices.
const MOBILE_LEFT = NAV_SECTIONS[0].items.slice(0, 2);
const MOBILE_RIGHT = [
  NAV_SECTIONS[1].items[0],
  NAV_SECTIONS[3].items[0],
] as const;

export function AppSidebar({
  email,
  name,
}: {
  email: string;
  name: string | null;
}) {
  const pathname = usePathname();
  const active = activeHref(pathname);
  const navRef = useRef<HTMLElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);

  // Show the "more below" arrow only while the nav still has content to scroll.
  useEffect(() => {
    const update = () => {
      const el = navRef.current;
      if (!el) return;
      setMoreBelow(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-forest-900 text-white md:flex">
        <div className="px-6 py-6">
          <Logo variant="white" width={132} />
        </div>

        <div className="relative min-h-0 flex-1">
          <nav
            ref={navRef}
            onScroll={() => {
              const el = navRef.current;
              if (!el) return;
              setMoreBelow(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
            }}
            className="h-full space-y-5 overflow-y-auto px-3 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
          {NAV_SECTIONS.map((section, sectionIndex) => (
            <div
              key={section.label ?? sectionIndex}
              className={
                sectionIndex > 0
                  ? "space-y-1 border-t border-white/10 pt-5"
                  : "space-y-1"
              }
            >
              {section.label ? (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-lime-300/60">
                  {section.label}
                </p>
              ) : null}
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={active === item.href}
                  variant="desktop"
                />
              ))}
            </div>
          ))}
          </nav>

          {moreBelow ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-forest-900 via-forest-900/80 to-transparent pb-1 pt-6">
              <button
                type="button"
                onClick={() =>
                  navRef.current?.scrollTo({
                    top: navRef.current.scrollHeight,
                    behavior: "smooth",
                  })
                }
                aria-label="Scroll navigation to the bottom"
                className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-2 border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-300 text-xs font-bold text-forest-900">
              {initials(name, email)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {name || "Your account"}
              </p>
              <p className="truncate text-[11px] text-white/45">{email}</p>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-forest-900/10 bg-cream-50/90 px-4 backdrop-blur md:hidden">
        <Logo width={112} />
        <Link
          href="/projects"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
            pathname.startsWith("/projects")
              ? "bg-brand-50 text-brand-700"
              : "text-forest-900/60",
          )}
        >
          <FolderKanban className="h-4 w-4" />
          Projects
        </Link>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-end justify-around border-t border-forest-900/10 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur md:hidden">
        {MOBILE_LEFT.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={active === item.href}
            variant="mobile"
          />
        ))}

        <Link
          href="/expenses/new"
          aria-label="Add expense"
          className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-lime-300 text-forest-900 shadow-lg shadow-forest-900/20 ring-4 ring-cream-50"
        >
          <Plus className="h-5 w-5" />
        </Link>

        {MOBILE_RIGHT.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={active === item.href}
            variant="mobile"
          />
        ))}
      </nav>
    </>
  );
}
