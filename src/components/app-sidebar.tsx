"use client";

import {
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

import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
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
  NAV_SECTIONS[2].items[0],
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

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-forest-900 text-white md:flex">
        <div className="px-6 py-6">
          <Logo variant="white" width={132} />
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
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

        <div className="mt-2 border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
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
          <SignOutButton className="w-full text-white/60 hover:bg-white/10 hover:text-white" />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-forest-900/10 bg-cream-50/90 px-4 backdrop-blur md:hidden">
        <Logo width={112} />
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
