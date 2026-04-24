CREATE TABLE "ai_model" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" text NOT NULL,
	"provider" text NOT NULL,
	"name" text NOT NULL,
	"vision" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_model_model_id_unique" UNIQUE("model_id")
);
--> statement-breakpoint
CREATE TABLE "ai_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"statement_extraction_model" text,
	"document_analysis_model" text,
	"categorization_model" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_preferences_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
ALTER TABLE "ai_preferences" ADD CONSTRAINT "ai_preferences_tenant_id_user_tenant_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."user_tenant"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_model_enabled_idx" ON "ai_model" USING btree ("enabled");--> statement-breakpoint
INSERT INTO "ai_model" ("model_id", "provider", "name", "vision") VALUES
	('anthropic/claude-opus-4.7', 'Anthropic', 'Claude Opus 4.7', true),
	('anthropic/claude-sonnet-4.5', 'Anthropic', 'Claude Sonnet 4.5', true),
	('anthropic/claude-haiku-4.5', 'Anthropic', 'Claude Haiku 4.5', true),
	('openai/gpt-5.5', 'OpenAI', 'GPT-5.5', true),
	('openai/gpt-5.4-mini', 'OpenAI', 'GPT-5.4 Mini', true),
	('openai/gpt-5.5-pro', 'OpenAI', 'GPT-5.5 Pro', false),
	('openai/gpt-5.4-nano', 'OpenAI', 'GPT-5.4 Nano', false),
	('google/gemini-3.1-pro-preview', 'Google', 'Gemini 3.1 Pro', true),
	('google/gemini-3-flash', 'Google', 'Gemini 3 Flash', true),
	('xai/grok-4.20-reasoning', 'xAI', 'Grok 4.20 Reasoning', true),
	('xai/grok-4.20-non-reasoning', 'xAI', 'Grok 4.20', true),
	('meta/llama-4-maverick', 'Meta', 'Llama 4 Maverick', true),
	('meta/llama-4-scout', 'Meta', 'Llama 4 Scout', true),
	('mistral/mistral-large-3', 'Mistral', 'Mistral Large 3', true),
	('mistral/mistral-medium', 'Mistral', 'Mistral Medium 3.1', false),
	('amazon/nova-2-lite', 'Amazon', 'Nova 2 Lite', true),
	('amazon/nova-pro', 'Amazon', 'Nova Pro', true),
	('deepseek/deepseek-v4-pro', 'DeepSeek', 'DeepSeek V4 Pro', false),
	('deepseek/deepseek-v4-flash', 'DeepSeek', 'DeepSeek V4 Flash', false)
ON CONFLICT ("model_id") DO NOTHING;