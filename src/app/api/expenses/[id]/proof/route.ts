import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid expense." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (expenseError || !expense) {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }

  const { data: attachments, error } = await supabase
    .from("attachments")
    .select("id, file_name, mime_type, size_bytes, storage_path, created_at")
    .eq("expense_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!attachments?.length) {
    return NextResponse.json({ proofs: [] });
  }

  const { data: signedUrls, error: signedError } = await supabase.storage
    .from("receipts")
    .createSignedUrls(
      attachments.map((attachment) => attachment.storage_path),
      60 * 10,
    );

  if (signedError) {
    return NextResponse.json({ error: signedError.message }, { status: 500 });
  }

  return NextResponse.json({
    proofs: attachments.map((attachment, index) => ({
      name: attachment.file_name,
      mimeType: attachment.mime_type,
      sizeBytes: attachment.size_bytes,
      url: signedUrls?.[index]?.signedUrl ?? null,
    })),
  });
}
