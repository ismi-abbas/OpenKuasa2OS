// Drizzle schema = source of truth. `pnpm db:generate` turns changes into SQL in apps/api/drizzle.
// User ids are text (better-auth ids). No RLS: authorization lives in the Worker (see ./org.ts).
import { sql } from "drizzle-orm";
import {
  bigint, boolean, check, date, foreignKey, index, integer, jsonb, pgTable, primaryKey,
  text, timestamp, unique, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const createdAt = () => ts("created_at").notNull().defaultNow();
const updatedAt = () => ts("updated_at").notNull().defaultNow();
const id = () => uuid("id").primaryKey().defaultRandom();
const orgId = () => uuid("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" });
const userRef = (name: string) => text(name).references(() => user.id, { onDelete: "set null" });

// ---- better-auth (names/columns fixed by better-auth; adapter reads these exports) ----
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: ts("createdAt").notNull(),
  updatedAt: ts("updatedAt").notNull(),
  twoFactorEnabled: boolean("twoFactorEnabled"),
  isAnonymous: boolean("isAnonymous"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: ts("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: ts("createdAt").notNull(),
  updatedAt: ts("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: ts("accessTokenExpiresAt"),
  refreshTokenExpiresAt: ts("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: ts("createdAt").notNull(),
  updatedAt: ts("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: ts("expiresAt").notNull(),
  createdAt: ts("createdAt").notNull(),
  updatedAt: ts("updatedAt").notNull(),
});

export const twoFactor = pgTable("twoFactor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backupCodes").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  verified: boolean("verified").default(true),
  failedVerificationCount: integer("failedVerificationCount").default(0),
  lockedUntil: ts("lockedUntil"),
});

// ---- tenancy ----
export const orgs = pgTable("orgs", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  createdAt: createdAt(),
  registrationNo: text("registration_no"),
  sstNo: text("sst_no"),
  website: text("website"),
  industry: text("industry"),
  companySize: text("company_size"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postcode: text("postcode"),
});

export const orgMembers = pgTable("org_members", {
  orgId: orgId(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("owner"),
  createdAt: createdAt(),
}, (t) => [
  primaryKey({ columns: [t.orgId, t.userId] }),
  index("org_members_user_id_idx").on(t.userId),
  check("org_members_role_check", sql`${t.role} in ('owner','admin','member','viewer')`),
]);

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  email: text("email"),
  fullName: text("full_name"),
  phone: text("phone"),
  jobTitle: text("job_title"),
  timezone: text("timezone").notNull().default("Asia/Kuala_Lumpur"),
  language: text("language").notNull().default("en"),
  productUpdates: boolean("product_updates").notNull().default(true),
  notificationPrefs: jsonb("notification_prefs").notNull().default({}),
  createdAt: createdAt(),
  avatarPath: text("avatar_path"),
  currentOrgId: uuid("current_org_id").references(() => orgs.id, { onDelete: "set null" }),
}, (t) => [check("profiles_language_check", sql`${t.language} in ('en','ms')`)]);

export const orgInvites = pgTable("org_invites", {
  id: id(),
  orgId: orgId(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  token: uuid("token").notNull().unique().defaultRandom(),
  invitedBy: userRef("invited_by"),
  createdAt: createdAt(),
  expiresAt: ts("expires_at").notNull().default(sql`now() + interval '7 days'`),
  acceptedAt: ts("accepted_at"),
  revokedAt: ts("revoked_at"),
}, (t) => [
  uniqueIndex("org_invites_pending_idx").on(t.orgId, t.email).where(sql`${t.acceptedAt} is null and ${t.revokedAt} is null`),
  check("org_invites_email_check", sql`${t.email} = lower(${t.email})`),
  check("org_invites_role_check", sql`${t.role} in ('admin','member','viewer')`),
]);

export const activityLog = pgTable("activity_log", {
  id: id(),
  orgId: orgId(),
  actorId: userRef("actor_id"),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  category: text("category").notNull(),
  createdAt: createdAt(),
}, (t) => [
  index("activity_log_org_created_idx").on(t.orgId, t.createdAt.desc()),
  check("activity_log_category_check", sql`${t.category} in ('auth','team','data','security','billing')`),
]);

export const notifications = pgTable("notifications", {
  id: id(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").references(() => orgs.id, { onDelete: "cascade" }),
  event: text("event").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  href: text("href"),
  readAt: ts("read_at"),
  createdAt: createdAt(),
}, (t) => [index("notifications_user_created_idx").on(t.userId, t.createdAt.desc())]);

// ---- AI ----
export const aiUsage = pgTable("ai_usage", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  day: date("day").notNull().default(sql`(now() at time zone 'utc')::date`),
  count: integer("count").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.userId, t.day] })]);

export const aiFreeUsage = pgTable("ai_free_usage", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  weekStart: date("week_start").notNull(),
  count: integer("count").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.userId, t.weekStart] })]);

export const orgAiKeys = pgTable("org_ai_keys", {
  orgId: uuid("org_id").primaryKey().references(() => orgs.id, { onDelete: "cascade" }),
  ciphertext: text("ciphertext").notNull(),
  keyHint: text("key_hint").notNull(),
  updatedBy: userRef("updated_by"),
  updatedAt: updatedAt(),
});

// ---- Reach (ads) ----
const CHANNELS = sql`('whatsapp','facebook','instagram','tiktok')`;

export const campaigns = pgTable("campaigns", {
  id: id(),
  orgId: orgId(),
  name: text("name").notNull(),
  channel: text("channel").notNull(),
  status: text("status").notNull().default("active"),
  leadsCount: integer("leads_count").notNull().default(0),
  spendCents: bigint("spend_cents", { mode: "number" }).notNull().default(0),
  cplCents: bigint("cpl_cents", { mode: "number" }),
  createdAt: createdAt(),
}, (t) => [
  index("campaigns_org_created_idx").on(t.orgId, t.createdAt.desc()),
  check("campaigns_channel_check", sql`${t.channel} in ${CHANNELS}`),
  check("campaigns_status_check", sql`${t.status} in ('active','paused')`),
]);

export const leads = pgTable("leads", {
  id: id(),
  orgId: orgId(),
  name: text("name").notNull(),
  channel: text("channel").notNull(),
  stage: text("stage").notNull(),
  source: text("source"),
  createdAt: createdAt(),
}, (t) => [
  index("leads_org_created_idx").on(t.orgId, t.createdAt.desc()),
  check("leads_channel_check", sql`${t.channel} in ${CHANNELS}`),
  check("leads_stage_check", sql`${t.stage} in ('lead','contacted','qualified','booked','won')`),
]);

export const appointments = pgTable("appointments", {
  id: id(),
  orgId: orgId(),
  contactName: text("contact_name").notNull(),
  kind: text("kind").notNull(),
  scheduledAt: ts("scheduled_at").notNull(),
  via: text("via"),
  createdAt: createdAt(),
}, (t) => [index("appointments_org_sched_idx").on(t.orgId, t.scheduledAt)]);

// ---- CRM (Air) ----
export const crmPipelines = pgTable("crm_pipelines", {
  id: id(),
  orgId: orgId(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  unique().on(t.orgId, t.name),
  unique().on(t.id, t.orgId),
  index("crm_pipelines_org_id_idx").on(t.orgId),
]);

export const crmPipelineStages = pgTable("crm_pipeline_stages", {
  id: id(),
  orgId: orgId(),
  pipelineId: uuid("pipeline_id").notNull(),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  probabilityPercent: integer("probability_percent").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  unique().on(t.pipelineId, t.position),
  unique().on(t.pipelineId, t.name),
  unique().on(t.id, t.pipelineId),
  foreignKey({ columns: [t.pipelineId, t.orgId], foreignColumns: [crmPipelines.id, crmPipelines.orgId] }).onDelete("cascade"),
  index("crm_pipeline_stages_org_id_idx").on(t.orgId),
  index("crm_pipeline_stages_pipeline_id_idx").on(t.pipelineId),
  check("crm_stage_probability_check", sql`${t.probabilityPercent} between 0 and 100`),
]);

export const crmContacts = pgTable("crm_contacts", {
  id: id(),
  orgId: orgId(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  country: text("country"),
  source: text("source"),
  status: text("status").notNull().default("lead"),
  leadScore: integer("lead_score").notNull().default(0),
  ownerUserId: userRef("owner_user_id"),
  tags: text("tags").array().notNull().default(sql`'{}'`),
  lastInteractionAt: ts("last_interaction_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  unique().on(t.id, t.orgId),
  index("crm_contacts_org_id_idx").on(t.orgId),
  index("crm_contacts_owner_user_id_idx").on(t.ownerUserId),
  index("crm_contacts_status_idx").on(t.status),
  check("crm_contacts_country_check", sql`${t.country} is null or ${t.country} ~ '^[A-Z]{2}$'`),
  check("crm_contacts_status_check", sql`${t.status} in ('lead','contacted','qualified','customer','archived')`),
  check("crm_contacts_score_check", sql`${t.leadScore} between 0 and 100`),
]);

export const crmDeals = pgTable("crm_deals", {
  id: id(),
  orgId: orgId(),
  contactId: uuid("contact_id").notNull(),
  pipelineId: uuid("pipeline_id").notNull(),
  stageId: uuid("stage_id").notNull(),
  title: text("title").notNull(),
  valueCents: bigint("value_cents", { mode: "number" }).notNull().default(0),
  currency: text("currency").notNull().default("MYR"),
  tag: text("tag"),
  status: text("status").notNull().default("open"),
  expectedCloseDate: date("expected_close_date"),
  wonAt: ts("won_at"),
  lostAt: ts("lost_at"),
  lostReason: text("lost_reason"),
  ownerUserId: userRef("owner_user_id"),
  lastActivityAt: ts("last_activity_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  unique().on(t.id, t.orgId),
  foreignKey({ columns: [t.contactId, t.orgId], foreignColumns: [crmContacts.id, crmContacts.orgId] }).onDelete("cascade"),
  foreignKey({ columns: [t.pipelineId, t.orgId], foreignColumns: [crmPipelines.id, crmPipelines.orgId] }).onDelete("restrict"),
  foreignKey({ columns: [t.stageId, t.pipelineId], foreignColumns: [crmPipelineStages.id, crmPipelineStages.pipelineId] }).onDelete("restrict"),
  index("crm_deals_org_id_idx").on(t.orgId),
  index("crm_deals_contact_id_idx").on(t.contactId),
  index("crm_deals_stage_id_idx").on(t.stageId),
  index("crm_deals_owner_user_id_idx").on(t.ownerUserId),
  index("crm_deals_status_idx").on(t.status),
  check("crm_deals_value_check", sql`${t.valueCents} >= 0`),
  check("crm_deals_status_check", sql`${t.status} in ('open','won','lost')`),
]);

const parentLinks = (t: { contactId: any; dealId: any; orgId: any }, prefix: string) => [
  check(`${prefix}_parent_check`, sql`${t.contactId} is not null or ${t.dealId} is not null`),
  foreignKey({ columns: [t.contactId, t.orgId], foreignColumns: [crmContacts.id, crmContacts.orgId] }).onDelete("cascade"),
  foreignKey({ columns: [t.dealId, t.orgId], foreignColumns: [crmDeals.id, crmDeals.orgId] }).onDelete("cascade"),
  index(`${prefix}_org_id_idx`).on(t.orgId),
];

export const crmActivities = pgTable("crm_activities", {
  id: id(),
  orgId: orgId(),
  contactId: uuid("contact_id"),
  dealId: uuid("deal_id"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  dueAt: ts("due_at"),
  completedAt: ts("completed_at"),
  ownerUserId: userRef("owner_user_id"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  ...parentLinks(t, "crm_activities"),
  index("crm_activities_contact_id_idx").on(t.contactId),
  index("crm_activities_deal_id_idx").on(t.dealId),
  index("crm_activities_due_at_idx").on(t.dueAt),
  check("crm_activities_type_check", sql`${t.type} in ('call','whatsapp','email','meeting','task','note')`),
]);

export const crmNotes = pgTable("crm_notes", {
  id: id(),
  orgId: orgId(),
  contactId: uuid("contact_id"),
  dealId: uuid("deal_id"),
  body: text("body").notNull(),
  createdBy: userRef("created_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  ...parentLinks(t, "crm_notes"),
  index("crm_notes_contact_id_idx").on(t.contactId),
  index("crm_notes_deal_id_idx").on(t.dealId),
]);

export const crmAttachments = pgTable("crm_attachments", {
  id: id(),
  orgId: orgId(),
  contactId: uuid("contact_id"),
  dealId: uuid("deal_id"),
  storagePath: text("storage_path").notNull(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type"),
  byteSize: bigint("byte_size", { mode: "number" }),
  uploadedBy: userRef("uploaded_by"),
  createdAt: createdAt(),
}, (t) => [
  ...parentLinks(t, "crm_attachments"),
  check("crm_attachments_size_check", sql`${t.byteSize} is null or ${t.byteSize} >= 0`),
]);

export const crmAuditLogs = pgTable("crm_audit_logs", {
  id: id(),
  orgId: orgId(),
  actorUserId: userRef("actor_user_id"),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: text("action").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: createdAt(),
}, (t) => [index("crm_audit_logs_org_id_created_at_idx").on(t.orgId, t.createdAt.desc())]);
