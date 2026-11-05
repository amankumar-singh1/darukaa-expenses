"use client";

import { Loader2, Paperclip, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Proof = {
  name: string;
  url: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
};

export function ProofButton({
  expenseId,
  count,
  className,
}: {
  expenseId: string;
  count: number;
  className?: string;
}) {
  const [proofs, setProofs] = useState<Proof[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleOpen() {
    if (proofs) {
      setOpen(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/expenses/${expenseId}/proof`, {
        credentials: "same-origin",
      });
      const data = (await response.json()) as {
        proofs?: Proof[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load the proof.");
      }

      setProofs(data.proofs ?? []);
      setOpen(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load the proof.");
    } finally {
      setLoading(false);
    }
  }

  if (count === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={loading}
        aria-label={`View ${count === 1 ? "proof" : `${count} proofs`} uploaded by you`}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md text-brand-600 transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 disabled:opacity-60",
          className,
        )}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-4 w-4" />}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Proof uploaded by you"
          className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/65 p-4 md:pl-64"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90dvh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-cream-50 p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-forest-900">Proof uploaded by you</p>
                <p className="mt-0.5 text-[11px] text-ink/45">
                  {count === 1 ? "1 file" : `${count} files`} attached to this expense.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink/50 transition hover:bg-forest-900/5 hover:text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error ? (
              <p className="mt-3 rounded-lg border border-danger/20 bg-danger-50 p-3 text-xs text-danger">
                {error}
              </p>
            ) : null}

            {error === "" && proofs?.length ? (
              <div className="mt-3 grid gap-3">
                {proofs.map((proof, index) => {
                  const isImage = proof.mimeType?.startsWith("image/");
                  const isPdf = proof.mimeType === "application/pdf";

                  return (
                    <figure
                      key={`${proof.name}-${index}`}
                      className="overflow-hidden rounded-xl border border-forest-900/10 bg-white"
                    >
                      {isImage && proof.url ? (
                        <div className="relative aspect-[4/3] w-full bg-cream-100">
                          <Image
                            src={proof.url}
                            alt={proof.name}
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 100vw, 720px"
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2 bg-white p-2">
                          {isPdf && proof.url ? (
                            <iframe
                              src={proof.url}
                              title={proof.name}
                              className="h-[60dvh] w-full rounded-xl border border-forest-900/10 bg-white"
                            />
                          ) : (
                            <a
                              href={proof.url ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="block p-4 text-sm text-brand-700 hover:underline"
                            >
                              {proof.name} — open file
                            </a>
                          )}
                          {proof.url ? (
                            <a
                              href={proof.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-[11px] font-semibold text-brand-700 hover:underline"
                            >
                              Open file in a new tab
                            </a>
                          ) : null}
                        </div>
                      )}
                      <figcaption className="border-t border-forest-900/8 px-3 py-2 text-[11px] text-ink/55">
                        {proof.name}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
