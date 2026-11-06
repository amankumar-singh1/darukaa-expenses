import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { createClient } from "@/lib/supabase/server";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/validation";

const HEADERS = [
  "Date",
  "Expense",
  "Amount (INR)",
  "Category",
  "Vendor",
  "Payment method",
  "Invoice number",
  "GST / tax amount (INR)",
  "Client / project",
  "Billable",
  "Note",
  "Proof",
] as const;

type ExportExpenseRow = {
  id: string;
  name: string;
  amount_minor: number;
  expense_date: string;
  vendor: string | null;
  payment_method: string | null;
  note: string | null;
  invoice_number: string | null;
  tax_amount_minor: number | null;
  client_project: string | null;
  is_billable: boolean;
  currency: string;
  categories: { name: string } | null;
  attachments: { file_name: string }[] | null;
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;

function validDate(value: string | null) {
  if (!value || !DATE_RE.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function filenameSafe(value: string) {
  return value.replace(/[^A-Za-z0-9_-]+/g, "-");
}

function csvCell(value: string | number | boolean | null | undefined) {
  const text =
    value === null || value === undefined ? "" : String(value);

  if (!/[,"\r\n]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function amount(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return (value / 100).toFixed(2);
}

function paymentLabel(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return PAYMENT_METHOD_LABELS[value as PaymentMethod] ?? value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format")?.toLowerCase() ?? "csv";
  const month = url.searchParams.get("month");
  const preset = url.searchParams.get("preset");
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  if (!["csv", "xlsx"].includes(format)) {
    return NextResponse.json({ error: "Choose CSV or Excel (.xlsx)." }, { status: 400 });
  }

  let fromDate: Date | null = null;
  let toDate: Date | null = null;
  let presetLabel = "custom";

  if (month && MONTH_RE.test(month)) {
    const [year, monthIndex] = month.split("-").map(Number);
    if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 1 || monthIndex > 12) {
      return NextResponse.json({ error: "Enter a valid month." }, { status: 400 });
    }
    const start = startOfMonth(new Date(Date.UTC(year, monthIndex - 1, 1)));
    const end = endOfMonth(start);
    fromDate = start;
    toDate = end;
    presetLabel = filenameSafe(month);
  } else if (preset) {
    const now = new Date();
    switch (preset) {
      case "week":
        fromDate = startOfWeek(now, { weekStartsOn: 1 });
        toDate = endOfWeek(now, { weekStartsOn: 1 });
        presetLabel = "this-week";
        break;
      case "last-week":
        fromDate = startOfWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), {
          weekStartsOn: 1,
        });
        toDate = endOfWeek(fromDate, { weekStartsOn: 1 });
        presetLabel = "last-week";
        break;
      case "last-30":
        toDate = new Date(now);
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        presetLabel = "last-30-days";
        break;
      default:
        return NextResponse.json({ error: "Unknown export range." }, { status: 400 });
    }
  } else {
    const from = validDate(fromParam);
    const to = validDate(toParam);
    if (!from || !to) {
      return NextResponse.json({ error: "Enter valid from and to dates (YYYY-MM-DD)." }, { status: 400 });
    }
    if (from > to) {
      return NextResponse.json({ error: "The from date must be before the to date." }, { status: 400 });
    }
    fromDate = from;
    toDate = to;
    presetLabel = filenameSafe(`${toDateInput(from)}_to_${toDateInput(to)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const from = toDateInput(fromDate);
  const to = toDateInput(toDate);

  const { data, error } = await supabase
    .from("expenses")
    .select(
      "id, name, amount_minor, expense_date, vendor, payment_method, note, invoice_number, tax_amount_minor, client_project, is_billable, currency, categories(name), attachments(file_name)",
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .gte("expense_date", from)
    .lte("expense_date", to)
    .order("expense_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as ExportExpenseRow[];

  const aoa = [
    [...HEADERS],
    ...rows.map((expense) => [
      expense.expense_date,
      expense.name,
      amount(expense.amount_minor),
      expense.categories?.name ?? "",
      expense.vendor ?? "",
      paymentLabel(expense.payment_method),
      expense.invoice_number ?? "",
      amount(expense.tax_amount_minor),
      expense.client_project ?? "",
      expense.is_billable ? "Yes" : "No",
      expense.note ?? "",
      (expense.attachments ?? []).map((attachment) => attachment.file_name).join("; "),
    ]),
  ];

  const filename = `expenses-${presetLabel}.${format}`;

  if (format === "csv") {
    const csv = ["\ufeff" + HEADERS.map(csvCell).join(","), ...aoa.slice(1).map((row) => row.map(csvCell).join(","))].join("\r\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet["!cols"] = HEADERS.map((header) => ({ wch: Math.max(22, header.length + 6) }));
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
