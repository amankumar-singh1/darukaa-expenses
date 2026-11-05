"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  showLabel = true,
  ...props
}: ButtonProps & { showLabel?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error(error.message);
        setPending(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleSignOut}
      disabled={pending}
      className={cn("justify-start gap-2", className)}
      {...props}
    >
      <LogOut className="h-4 w-4" />
      {showLabel ? (pending ? "Signing out…" : "Sign out") : null}
    </Button>
  );
}
