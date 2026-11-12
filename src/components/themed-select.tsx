"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type ThemedSelectOption = { value: string; label: string };

export function ThemedSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select…",
  ariaLabel,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly ThemedSelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(() =>
    Math.max(0, options.findIndex((option) => option.value === value)),
  );
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  // Keep the fixed-position list glued to the button on scroll/resize.
  // Scrolls that happen inside the list itself are ignored.
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const estimatedHeight = Math.min(256, options.length * 40 + 8);
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < estimatedHeight && rect.top > spaceBelow;
      setCoords({
        top: Math.max(
          8,
          openUp ? rect.top - estimatedHeight - 8 : rect.bottom + 8,
        ),
        left: rect.left,
        width: rect.width,
      });
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setOpen(false);
      }
    };
    update();
    const onScrollOrResize = (event: Event) => {
      if (
        event.target instanceof Node &&
        listRef.current?.contains(event.target)
      ) {
        return;
      }
      update();
    };
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", update);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function selectAt(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setHighlight(index);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (
      !open &&
      (event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === " ")
    ) {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((index) => (index - 1 + options.length) % options.length);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectAt(highlight);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onKeyDown={onKeyDown}
    >
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm shadow-[0_1px_1px_rgba(14,42,29,0.03)] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15",
          open ? "border-brand-600" : "border-forest-900/15",
          value ? "text-ink" : "text-ink/45",
        )}
      >
        <span className="truncate">
          {options.find((option) => option.value === value)?.label ||
            placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-forest-900 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open
        ? createPortal(
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: coords.width,
                zIndex: 1000,
              }}
              className="max-h-64 overflow-y-auto rounded-xl border border-forest-900/15 bg-white py-1 shadow-lg shadow-forest-900/10"
            >
              {options.map((option, index) => {
                const selected = option.value === value;
                const highlighted = index === highlight;
                return (
                  <li key={option.value || "empty"}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => selectAt(index)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition",
                        highlighted
                          ? "bg-cream-100 text-forest-900"
                          : "text-ink",
                        selected && "font-semibold text-forest-900",
                      )}
                    >
                      {option.label}
                      {selected ? (
                        <Check className="h-4 w-4 shrink-0 text-brand-600" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
