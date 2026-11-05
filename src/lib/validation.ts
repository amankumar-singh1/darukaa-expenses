import { z } from "zod";

export const PAYMENT_METHODS = [
  "cash",
  "upi",
  "card",
  "bank",
  "other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank: "Bank transfer",
  other: "Other",
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null);

const optionalAmount = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  },
  z
    .number()
    .min(0, "Tax cannot be negative")
    .max(1_000_000_000, "Tax amount is too large")
    .nullable(),
);

export const attachmentSchema = z.object({
  storagePath: z.string().min(1).max(500),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024, "Each file must be 10 MB or smaller"),
});

export const expenseSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z
      .string()
      .trim()
      .min(1, "Give the expense a name")
      .max(120, "Name is too long"),
    amount: z.coerce
      .number()
      .positive("Amount must be more than zero")
      .max(1_000_000_000, "Amount is too large"),
    expenseDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date"),
    categoryId: z.string().uuid().nullable().optional(),
    vendor: optionalText(120),
    paymentMethod: z.enum(PAYMENT_METHODS).nullable().optional(),
    note: optionalText(2_000),
    invoiceNumber: optionalText(80),
    taxAmount: optionalAmount,
    clientProject: optionalText(120),
    isBillable: z.boolean().optional().default(false),
    attachments: z.array(attachmentSchema).max(5).optional().default([]),
    keepAttachmentIds: z.array(z.string().uuid()).optional(),
  })
  .superRefine((data, context) => {
    if (data.taxAmount !== null && data.taxAmount > data.amount) {
      context.addIssue({
        code: "custom",
        path: ["taxAmount"],
        message: "Tax cannot be more than the total amount",
      });
    }
  });

export type ExpenseInput = z.infer<typeof expenseSchema>;

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(40, "Category name is too long"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid colour"),
});

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .max(80, "Name is too long")
    .optional()
    .nullable(),
  gstin: z
    .string()
    .trim()
    .max(20, "GSTIN is too long")
    .optional()
    .nullable()
    .transform((value) => (value ? value.toUpperCase() : null)),
});

export const CATEGORY_COLORS = [
  "#009245",
  "#0E2A1D",
  "#B6F07F",
  "#FEBC2E",
  "#E5484D",
  "#3B82F6",
  "#8B5CF6",
  "#F97316",
];
