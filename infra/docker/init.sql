-- Initial database setup
-- This script runs when the PostgreSQL container is first created

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
