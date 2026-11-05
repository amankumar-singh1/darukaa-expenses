export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  is_archived: boolean;
  created_at: string;
};

export type Attachment = {
  id: string;
  expense_id: string;
  user_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  name: string;
  amount_minor: number;
  currency: string;
  expense_date: string;
  category_id: string | null;
  vendor: string | null;
  payment_method: string | null;
  note: string | null;
  invoice_number: string | null;
  tax_amount_minor: number | null;
  client_project: string | null;
  is_billable: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  categories?: Pick<Category, "id" | "name" | "color"> | null;
  attachments?: Attachment[];
};

export type Profile = {
  id: string;
  full_name: string | null;
  currency: string;
  gstin: string | null;
  created_at: string;
};

export type AttachmentInput = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type AttachmentWithUrl = Pick<
  Attachment,
  "id" | "file_name" | "mime_type" | "size_bytes"
> & {
  storage_path: string;
  url: string | null;
};
