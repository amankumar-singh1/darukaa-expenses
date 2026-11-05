import type { Metadata } from "next";

import { updateProfile } from "./actions";
import { PageHeader } from "@/components/page-header";
import { SignOutButton } from "@/components/sign-out-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, gstin")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Your details, tax information, and account controls."
      />

      {params.saved ? (
        <div className="mb-4 rounded-lg border border-brand-600/20 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Settings saved.
        </div>
      ) : null}

      {params.error ? (
        <div className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger">
          {params.error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateProfile} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    defaultValue={profile?.full_name ?? ""}
                    maxLength={80}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email ?? ""}
                    readOnly
                    disabled
                  />
                  <p className="mt-1 text-[11px] text-ink/40">
                    Your sign-in email cannot be changed here.
                  </p>
                </div>

                <div>
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    name="gstin"
                    defaultValue={profile?.gstin ?? ""}
                    maxLength={20}
                    placeholder="22AAAAA0000A1Z5"
                    className="font-mono uppercase"
                  />
                  <p className="mt-1 text-[11px] text-ink/40">
                    Optional. Used for tax-time exports and reports.
                  </p>
                </div>

                <div className="pt-1">
                  <SubmitButton>Save changes</SubmitButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-ink/40">Signed in as</p>
                <p className="mt-1 truncate text-sm font-medium text-forest-900">
                  {user.email}
                </p>
              </div>
              <SignOutButton
                variant="outline"
                className="w-full justify-center"
              />
            </CardContent>
          </Card>

          <Card className="border-forest-900/10 bg-cream-100/60">
            <CardContent className="px-5 py-5">
              <p className="text-xs font-semibold text-forest-900">
                Data & privacy
              </p>
              <p className="mt-2 text-[11px] leading-5 text-ink/50">
                Invoices are stored in a private bucket. Only your signed-in
                account can request a temporary viewing link.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
