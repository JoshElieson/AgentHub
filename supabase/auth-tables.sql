-- NextAuth + user/follow tables for Prisma adapter.
-- Safe to run against an existing Supabase database — uses IF NOT EXISTS throughout.
-- Does NOT touch the snake_case tables (skills, collections, mcp_servers, etc.)
-- that are managed by the Supabase JS client.

-- User -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "User" (
    "id"            TEXT        NOT NULL,
    "username"      TEXT,
    "name"          TEXT,
    "email"         TEXT,
    "emailVerified" TIMESTAMPTZ,
    "image"         TEXT,
    "bio"           TEXT,
    "avatarColor"   TEXT,
    "website"       TEXT,
    "github"        TEXT,
    "twitter"       TEXT,
    "location"      TEXT,
    "isVerified"    BOOLEAN     NOT NULL DEFAULT false,
    "followers"     INTEGER     NOT NULL DEFAULT 0,
    "following"     INTEGER     NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"    ON "User"("email");

-- Account (OAuth provider links) ---------------------------------------
CREATE TABLE IF NOT EXISTS "Account" (
    "id"                TEXT    NOT NULL,
    "userId"            TEXT    NOT NULL,
    "type"              TEXT    NOT NULL,
    "provider"          TEXT    NOT NULL,
    "providerAccountId" TEXT    NOT NULL,
    "refresh_token"     TEXT,
    "access_token"      TEXT,
    "expires_at"        INTEGER,
    "token_type"        TEXT,
    "scope"             TEXT,
    "id_token"          TEXT,
    "session_state"     TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Account_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX        IF NOT EXISTS "Account_userId_idx"                   ON "Account"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- Session --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Session" (
    "id"           TEXT        NOT NULL,
    "sessionToken" TEXT        NOT NULL,
    "userId"       TEXT        NOT NULL,
    "expires"      TIMESTAMPTZ NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Session_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX        IF NOT EXISTS "Session_userId_idx"        ON "Session"("userId");

-- VerificationToken ----------------------------------------------------
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT        NOT NULL,
    "token"      TEXT        NOT NULL,
    "expires"    TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key"            ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- Follow (social graph) ------------------------------------------------
CREATE TABLE IF NOT EXISTS "Follow" (
    "id"          TEXT        NOT NULL,
    "followerId"  TEXT        NOT NULL,
    "followingId" TEXT        NOT NULL,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Follow_followerId_fkey"
        FOREIGN KEY ("followerId")  REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Follow_followingId_fkey"
        FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");
CREATE INDEX        IF NOT EXISTS "Follow_followingId_idx"             ON "Follow"("followingId");
