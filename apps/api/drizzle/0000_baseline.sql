CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"actor_id" text,
	"actor_name" text NOT NULL,
	"action" text NOT NULL,
	"target" text,
	"category" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_log_category_check" CHECK ("activity_log"."category" in ('auth','team','data','security','billing'))
);
--> statement-breakpoint
CREATE TABLE "ai_free_usage" (
	"user_id" text NOT NULL,
	"week_start" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ai_free_usage_user_id_week_start_pk" PRIMARY KEY("user_id","week_start")
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"user_id" text NOT NULL,
	"day" date DEFAULT (now() at time zone 'utc')::date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ai_usage_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"contact_name" text NOT NULL,
	"kind" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"via" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"leads_count" integer DEFAULT 0 NOT NULL,
	"spend_cents" bigint DEFAULT 0 NOT NULL,
	"cpl_cents" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_channel_check" CHECK ("campaigns"."channel" in ('whatsapp','facebook','instagram','tiktok')),
	CONSTRAINT "campaigns_status_check" CHECK ("campaigns"."status" in ('active','paused'))
);
--> statement-breakpoint
CREATE TABLE "crm_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"contact_id" uuid,
	"deal_id" uuid,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"owner_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_activities_parent_check" CHECK ("crm_activities"."contact_id" is not null or "crm_activities"."deal_id" is not null),
	CONSTRAINT "crm_activities_type_check" CHECK ("crm_activities"."type" in ('call','whatsapp','email','meeting','task','note'))
);
--> statement-breakpoint
CREATE TABLE "crm_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"contact_id" uuid,
	"deal_id" uuid,
	"storage_path" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text,
	"byte_size" bigint,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_attachments_parent_check" CHECK ("crm_attachments"."contact_id" is not null or "crm_attachments"."deal_id" is not null),
	CONSTRAINT "crm_attachments_size_check" CHECK ("crm_attachments"."byte_size" is null or "crm_attachments"."byte_size" >= 0)
);
--> statement-breakpoint
CREATE TABLE "crm_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"actor_user_id" text,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"company" text,
	"email" text,
	"phone" text,
	"country" text,
	"source" text,
	"status" text DEFAULT 'lead' NOT NULL,
	"lead_score" integer DEFAULT 0 NOT NULL,
	"owner_user_id" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"last_interaction_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_contacts_id_org_id_unique" UNIQUE("id","org_id"),
	CONSTRAINT "crm_contacts_country_check" CHECK ("crm_contacts"."country" is null or "crm_contacts"."country" ~ '^[A-Z]{2}$'),
	CONSTRAINT "crm_contacts_status_check" CHECK ("crm_contacts"."status" in ('lead','contacted','qualified','customer','archived')),
	CONSTRAINT "crm_contacts_score_check" CHECK ("crm_contacts"."lead_score" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "crm_deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"stage_id" uuid NOT NULL,
	"title" text NOT NULL,
	"value_cents" bigint DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'MYR' NOT NULL,
	"tag" text,
	"status" text DEFAULT 'open' NOT NULL,
	"expected_close_date" date,
	"won_at" timestamp with time zone,
	"lost_at" timestamp with time zone,
	"lost_reason" text,
	"owner_user_id" text,
	"last_activity_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_deals_id_org_id_unique" UNIQUE("id","org_id"),
	CONSTRAINT "crm_deals_value_check" CHECK ("crm_deals"."value_cents" >= 0),
	CONSTRAINT "crm_deals_status_check" CHECK ("crm_deals"."status" in ('open','won','lost'))
);
--> statement-breakpoint
CREATE TABLE "crm_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"contact_id" uuid,
	"deal_id" uuid,
	"body" text NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_notes_parent_check" CHECK ("crm_notes"."contact_id" is not null or "crm_notes"."deal_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "crm_pipeline_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"probability_percent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_pipeline_stages_pipeline_id_position_unique" UNIQUE("pipeline_id","position"),
	CONSTRAINT "crm_pipeline_stages_pipeline_id_name_unique" UNIQUE("pipeline_id","name"),
	CONSTRAINT "crm_pipeline_stages_id_pipeline_id_unique" UNIQUE("id","pipeline_id"),
	CONSTRAINT "crm_stage_probability_check" CHECK ("crm_pipeline_stages"."probability_percent" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "crm_pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_pipelines_org_id_name_unique" UNIQUE("org_id","name"),
	CONSTRAINT "crm_pipelines_id_org_id_unique" UNIQUE("id","org_id")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"channel" text NOT NULL,
	"stage" text NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_channel_check" CHECK ("leads"."channel" in ('whatsapp','facebook','instagram','tiktok')),
	CONSTRAINT "leads_stage_check" CHECK ("leads"."stage" in ('lead','contacted','qualified','booked','won'))
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"org_id" uuid,
	"event" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"href" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_ai_keys" (
	"org_id" uuid PRIMARY KEY NOT NULL,
	"ciphertext" text NOT NULL,
	"key_hint" text NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"invited_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone DEFAULT now() + interval '7 days' NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "org_invites_token_unique" UNIQUE("token"),
	CONSTRAINT "org_invites_email_check" CHECK ("org_invites"."email" = lower("org_invites"."email")),
	CONSTRAINT "org_invites_role_check" CHECK ("org_invites"."role" in ('admin','member','viewer'))
);
--> statement-breakpoint
CREATE TABLE "org_members" (
	"org_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_members_org_id_user_id_pk" PRIMARY KEY("org_id","user_id"),
	CONSTRAINT "org_members_role_check" CHECK ("org_members"."role" in ('owner','admin','member','viewer'))
);
--> statement-breakpoint
CREATE TABLE "orgs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"registration_no" text,
	"sst_no" text,
	"website" text,
	"industry" text,
	"company_size" text,
	"address" text,
	"city" text,
	"state" text,
	"postcode" text,
	CONSTRAINT "orgs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"email" text,
	"full_name" text,
	"phone" text,
	"job_title" text,
	"timezone" text DEFAULT 'Asia/Kuala_Lumpur' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"product_updates" boolean DEFAULT true NOT NULL,
	"notification_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"avatar_path" text,
	"current_org_id" uuid,
	CONSTRAINT "profiles_language_check" CHECK ("profiles"."language" in ('en','ms'))
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "twoFactor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backupCodes" text NOT NULL,
	"userId" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failedVerificationCount" integer DEFAULT 0,
	"lockedUntil" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"twoFactorEnabled" boolean,
	"isAnonymous" boolean,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_free_usage" ADD CONSTRAINT "ai_free_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_contact_id_org_id_crm_contacts_id_org_id_fk" FOREIGN KEY ("contact_id","org_id") REFERENCES "public"."crm_contacts"("id","org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_deal_id_org_id_crm_deals_id_org_id_fk" FOREIGN KEY ("deal_id","org_id") REFERENCES "public"."crm_deals"("id","org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_attachments" ADD CONSTRAINT "crm_attachments_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_attachments" ADD CONSTRAINT "crm_attachments_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_attachments" ADD CONSTRAINT "crm_attachments_contact_id_org_id_crm_contacts_id_org_id_fk" FOREIGN KEY ("contact_id","org_id") REFERENCES "public"."crm_contacts"("id","org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_attachments" ADD CONSTRAINT "crm_attachments_deal_id_org_id_crm_deals_id_org_id_fk" FOREIGN KEY ("deal_id","org_id") REFERENCES "public"."crm_deals"("id","org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_audit_logs" ADD CONSTRAINT "crm_audit_logs_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_audit_logs" ADD CONSTRAINT "crm_audit_logs_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_contact_id_org_id_crm_contacts_id_org_id_fk" FOREIGN KEY ("contact_id","org_id") REFERENCES "public"."crm_contacts"("id","org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_pipeline_id_org_id_crm_pipelines_id_org_id_fk" FOREIGN KEY ("pipeline_id","org_id") REFERENCES "public"."crm_pipelines"("id","org_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_stage_id_pipeline_id_crm_pipeline_stages_id_pipeline_id_fk" FOREIGN KEY ("stage_id","pipeline_id") REFERENCES "public"."crm_pipeline_stages"("id","pipeline_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_contact_id_org_id_crm_contacts_id_org_id_fk" FOREIGN KEY ("contact_id","org_id") REFERENCES "public"."crm_contacts"("id","org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_deal_id_org_id_crm_deals_id_org_id_fk" FOREIGN KEY ("deal_id","org_id") REFERENCES "public"."crm_deals"("id","org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_pipeline_stages" ADD CONSTRAINT "crm_pipeline_stages_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_pipeline_stages" ADD CONSTRAINT "crm_pipeline_stages_pipeline_id_org_id_crm_pipelines_id_org_id_fk" FOREIGN KEY ("pipeline_id","org_id") REFERENCES "public"."crm_pipelines"("id","org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_pipelines" ADD CONSTRAINT "crm_pipelines_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_ai_keys" ADD CONSTRAINT "org_ai_keys_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_ai_keys" ADD CONSTRAINT "org_ai_keys_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_invites" ADD CONSTRAINT "org_invites_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_invites" ADD CONSTRAINT "org_invites_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_current_org_id_orgs_id_fk" FOREIGN KEY ("current_org_id") REFERENCES "public"."orgs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_org_created_idx" ON "activity_log" USING btree ("org_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "appointments_org_sched_idx" ON "appointments" USING btree ("org_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "campaigns_org_created_idx" ON "campaigns" USING btree ("org_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "crm_activities_org_id_idx" ON "crm_activities" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "crm_activities_contact_id_idx" ON "crm_activities" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "crm_activities_deal_id_idx" ON "crm_activities" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "crm_activities_due_at_idx" ON "crm_activities" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "crm_attachments_org_id_idx" ON "crm_attachments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "crm_audit_logs_org_id_created_at_idx" ON "crm_audit_logs" USING btree ("org_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "crm_contacts_org_id_idx" ON "crm_contacts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "crm_contacts_owner_user_id_idx" ON "crm_contacts" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "crm_contacts_status_idx" ON "crm_contacts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crm_deals_org_id_idx" ON "crm_deals" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "crm_deals_contact_id_idx" ON "crm_deals" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "crm_deals_stage_id_idx" ON "crm_deals" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "crm_deals_owner_user_id_idx" ON "crm_deals" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "crm_deals_status_idx" ON "crm_deals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crm_notes_org_id_idx" ON "crm_notes" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "crm_notes_contact_id_idx" ON "crm_notes" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "crm_notes_deal_id_idx" ON "crm_notes" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "crm_pipeline_stages_org_id_idx" ON "crm_pipeline_stages" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "crm_pipeline_stages_pipeline_id_idx" ON "crm_pipeline_stages" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "crm_pipelines_org_id_idx" ON "crm_pipelines" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "leads_org_created_idx" ON "leads" USING btree ("org_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "org_invites_pending_idx" ON "org_invites" USING btree ("org_id","email") WHERE "org_invites"."accepted_at" is null and "org_invites"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "org_members_user_id_idx" ON "org_members" USING btree ("user_id");