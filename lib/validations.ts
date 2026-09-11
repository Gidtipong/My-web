import { z } from "zod";

// IPv4 regular expression for network device validation
const IPV4_REGEX =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// Enums conforming to Prisma Schema
export const UserRoleEnum = z.enum(["ADMIN", "USER"]);

export const DeviceRoleEnum = z.enum([
  "Core",
  "Distribution",
  "Access",
  "Firewall",
  "AP",
  "Router",
  "UPS",
  "Other",
]);

export const DeviceStatusEnum = z.enum(["ACTIVE", "MAINTENANCE", "RETIRED"]);

export const TaskTypeEnum = z.enum(["TASK", "INCIDENT", "CHANGE", "MAINTENANCE", "AUDIT"]);

export const TaskPriorityEnum = z.enum(["P1", "P2", "P3", "P4"]);

export const TaskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE", "CANCELLED"]);

export const CaseCategoryEnum = z.enum([
  "CONNECTIVITY",
  "PERFORMANCE",
  "HARDWARE",
  "CONFIGURATION",
  "SECURITY",
  "WIRELESS",
  "ISP",
  "POWER",
  "OTHER",
]);

export const CaseSeverityEnum = z.enum(["P1", "P2", "P3", "P4"]);

// ============================================================================
// User Validation
// ============================================================================
export const userSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  role: UserRoleEnum.default("USER"),
});

export const userUpdateSchema = userSchema.partial();

// ============================================================================
// Site Validation
// ============================================================================
export const siteSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ Site / สาขา"),
  location: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const siteUpdateSchema = siteSchema.partial();

// ============================================================================
// Device Validation
// ============================================================================
export const deviceSchema = z.object({
  hostname: z
    .string()
    .min(1, "กรุณาระบุ Hostname")
    .regex(/^[a-zA-Z0-9._-]+$/, "Hostname ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข จุด หรือขีด"),
  ipAddress: z
    .string()
    .min(1, "กรุณาระบุ IP Address")
    .regex(IPV4_REGEX, "รูปแบบ IP Address ไม่ถูกต้อง (เช่น 192.168.1.1)"),
  vendor: z.string().min(1, "กรุณาระบุยี่ห้อ (Vendor เช่น Cisco, Fortinet, Ubiquiti)"),
  model: z.string().min(1, "กรุณาระบุรุ่น (Model)"),
  serialNumber: z.string().optional().nullable(),
  role: DeviceRoleEnum.default("Other"),
  status: DeviceStatusEnum.default("ACTIVE"),
  siteId: z.string().uuid("กรุณาเลือก Site ให้ถูกต้อง").optional().nullable(),
  purchaseDate: z.coerce.date().optional().nullable(),
  warrantyEnd: z.coerce.date().optional().nullable(),
  licenseEnd: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const deviceUpdateSchema = deviceSchema.partial();

// ============================================================================
// Task Validation
// ============================================================================
export const taskSchema = z.object({
  title: z.string().min(1, "กรุณาระบุชื่องาน (Title)"),
  description: z.string().optional().nullable(),
  type: TaskTypeEnum.default("TASK"),
  priority: TaskPriorityEnum.default("P3"),
  status: TaskStatusEnum.default("TODO"),
  dueDate: z.coerce.date().optional().nullable(),
  startAt: z.coerce.date().optional().nullable(),
  endAt: z.coerce.date().optional().nullable(),
  siteId: z.string().uuid().optional().nullable(),
  deviceId: z.string().uuid().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  ticketRef: z.string().optional().nullable(),
  rollbackPlan: z.string().optional().nullable(),
  recurrence: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
});

// Fast entry task schema (<10s quick add)
export const quickTaskSchema = z.object({
  title: z.string().min(1, "กรุณาระบุชื่องาน"),
  priority: TaskPriorityEnum.default("P3"),
  type: TaskTypeEnum.default("TASK"),
  dueDate: z.coerce.date().optional().nullable(),
  siteId: z.string().uuid().optional().nullable(),
  deviceId: z.string().uuid().optional().nullable(),
});

export const taskUpdateSchema = taskSchema.partial().extend({
  completedAt: z.coerce.date().optional().nullable(),
});

// ============================================================================
// Checklist & Note Validation
// ============================================================================
export const checklistSchema = z.object({
  taskId: z.string().uuid(),
  text: z.string().min(1, "กรุณาระบุข้อความรายการ"),
  done: z.boolean().default(false),
  order: z.number().int().default(0),
});

export const checklistUpdateSchema = z.object({
  text: z.string().min(1).optional(),
  done: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const noteSchema = z.object({
  taskId: z.string().uuid(),
  content: z.string().min(1, "กรุณาระบุข้อความ Note"),
});

// ============================================================================
// Case (Troubleshooting Knowledge Base) Validation
// ============================================================================
export const caseSchema = z.object({
  caseNumber: z
    .string()
    .regex(/^CASE-\d{4}-\d{4}$/, "รหัสเคสต้องอยู่ในรูปแบบ CASE-YYYY-NNNN เช่น CASE-2026-0001")
    .optional(), // Can be auto-generated
  title: z.string().min(1, "กรุณาระบุหัวข้อปัญหา"),
  symptom: z.string().min(1, "กรุณาระบุอาการของปัญหา (Symptom)"),
  cause: z.string().optional().nullable(),
  solution: z.string().min(1, "กรุณาระบุวิธีการแก้ไข (Solution)"),
  prevention: z.string().optional().nullable(),
  category: CaseCategoryEnum.default("CONNECTIVITY"),
  severity: CaseSeverityEnum.default("P3"),
  vendor: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  siteId: z.string().uuid().optional().nullable(),
  deviceId: z.string().uuid().optional().nullable(),
  taskId: z.string().uuid().optional().nullable(),
  timeToFix: z.number().int().min(0, "ระยะเวลาต้องไม่ติดลบ").optional().nullable(),
  occurredAt: z.coerce.date().default(() => new Date()),
  resolvedAt: z.coerce.date().optional().nullable(),
  isFavorite: z.boolean().default(false),
  isPinned: z.boolean().default(false),
});

export const caseUpdateSchema = caseSchema.partial();

// ============================================================================
// Attachment & Audit Log Validation
// ============================================================================
export const attachmentSchema = z.object({
  caseId: z.string().uuid(),
  fileName: z.string().min(1),
  fileUrl: z.string().url("รูปแบบ URL ของไฟล์ไม่ถูกต้อง"),
  fileType: z.string().min(1),
  fileSize: z.number().int().min(1),
});

export const auditLogSchema = z.object({
  action: z.string().min(1),
  tableName: z.string().min(1),
  recordId: z.string().min(1),
  userId: z.string().uuid().optional().nullable(),
  meta: z.record(z.string(), z.any()).optional().nullable(),
});
