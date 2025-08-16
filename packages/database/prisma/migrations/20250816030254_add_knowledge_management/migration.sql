-- CreateTable
CREATE TABLE "public"."projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "path" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "languages" TEXT[],
    "frameworks" TEXT[],
    "fileCount" INTEGER NOT NULL,
    "codeComplexity" DOUBLE PRECISION NOT NULL,
    "maintainabilityScore" DOUBLE PRECISION NOT NULL,
    "testCoverage" DOUBLE PRECISION,
    "bundleSize" INTEGER,
    "loadTime" INTEGER,
    "lighthouse" INTEGER,
    "hasClaudeMd" BOOLEAN NOT NULL DEFAULT false,
    "hasMemoryFile" BOOLEAN NOT NULL DEFAULT false,
    "optimizationLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_dependencies" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "project_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "type" TEXT NOT NULL,
    "framework" TEXT,
    "language" TEXT NOT NULL,
    "files" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "requirements" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_templates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recommendations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effort" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analysis_cache" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."telemetry_events" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "userId" TEXT,
    "projectId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."knowledge_patterns" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pattern" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "framework" TEXT,
    "version" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "lastVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."best_practices" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "codeExample" TEXT,
    "antiPattern" TEXT,
    "framework" TEXT,
    "language" TEXT,
    "projectType" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "sourceUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "supersededBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patternId" TEXT,

    CONSTRAINT "best_practices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_configurations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "claudeConfig" JSONB NOT NULL,
    "hooks" JSONB NOT NULL,
    "slashCommands" JSONB NOT NULL,
    "mcpServers" JSONB NOT NULL,
    "agents" JSONB NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patternId" TEXT,

    CONSTRAINT "project_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."knowledge_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "scrapeConfig" JSONB NOT NULL,
    "frequency" TEXT NOT NULL,
    "lastScraped" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "reliability" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."knowledge_updates" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "changes" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "patternsFound" INTEGER NOT NULL DEFAULT 0,
    "practicesFound" INTEGER NOT NULL DEFAULT 0,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "knowledge_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hooks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "config" JSONB,
    "frameworks" TEXT[],
    "projectTypes" TEXT[],
    "tested" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "author" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "capabilities" JSONB NOT NULL,
    "requirements" JSONB,
    "successRate" DOUBLE PRECISION,
    "avgDuration" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "author" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_path_key" ON "public"."projects"("path");

-- CreateIndex
CREATE UNIQUE INDEX "project_dependencies_projectId_name_key" ON "public"."project_dependencies"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "templates_name_key" ON "public"."templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "project_templates_projectId_templateId_key" ON "public"."project_templates"("projectId", "templateId");

-- CreateIndex
CREATE UNIQUE INDEX "analysis_cache_key_key" ON "public"."analysis_cache"("key");

-- CreateIndex
CREATE INDEX "analysis_cache_expiresAt_idx" ON "public"."analysis_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_configs_userId_key" ON "public"."user_configs"("userId");

-- CreateIndex
CREATE INDEX "telemetry_events_event_idx" ON "public"."telemetry_events"("event");

-- CreateIndex
CREATE INDEX "telemetry_events_userId_idx" ON "public"."telemetry_events"("userId");

-- CreateIndex
CREATE INDEX "telemetry_events_createdAt_idx" ON "public"."telemetry_events"("createdAt");

-- CreateIndex
CREATE INDEX "knowledge_patterns_type_category_idx" ON "public"."knowledge_patterns"("type", "category");

-- CreateIndex
CREATE INDEX "knowledge_patterns_framework_version_idx" ON "public"."knowledge_patterns"("framework", "version");

-- CreateIndex
CREATE INDEX "knowledge_patterns_confidence_idx" ON "public"."knowledge_patterns"("confidence");

-- CreateIndex
CREATE INDEX "best_practices_category_framework_idx" ON "public"."best_practices"("category", "framework");

-- CreateIndex
CREATE INDEX "best_practices_confidence_idx" ON "public"."best_practices"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "project_configurations_projectId_key" ON "public"."project_configurations"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_sources_name_key" ON "public"."knowledge_sources"("name");

-- CreateIndex
CREATE INDEX "knowledge_updates_sourceId_scrapedAt_idx" ON "public"."knowledge_updates"("sourceId", "scrapedAt");

-- CreateIndex
CREATE UNIQUE INDEX "hooks_name_key" ON "public"."hooks"("name");

-- CreateIndex
CREATE INDEX "hooks_category_idx" ON "public"."hooks"("category");

-- CreateIndex
CREATE UNIQUE INDEX "agents_name_key" ON "public"."agents"("name");

-- CreateIndex
CREATE INDEX "agents_type_idx" ON "public"."agents"("type");

-- AddForeignKey
ALTER TABLE "public"."project_dependencies" ADD CONSTRAINT "project_dependencies_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_templates" ADD CONSTRAINT "project_templates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_templates" ADD CONSTRAINT "project_templates_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recommendations" ADD CONSTRAINT "recommendations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."best_practices" ADD CONSTRAINT "best_practices_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "public"."knowledge_patterns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_configurations" ADD CONSTRAINT "project_configurations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_configurations" ADD CONSTRAINT "project_configurations_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "public"."knowledge_patterns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledge_updates" ADD CONSTRAINT "knowledge_updates_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "public"."knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
