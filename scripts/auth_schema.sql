-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS auth.audit_log_entries CASCADE;
DROP TABLE IF EXISTS auth.flow_state CASCADE;
DROP TABLE IF EXISTS auth.identities CASCADE;
DROP TABLE IF EXISTS auth.instances CASCADE;
DROP TABLE IF EXISTS auth.mfa_amr_claims CASCADE;
DROP TABLE IF EXISTS auth.mfa_challenges CASCADE;
DROP TABLE IF EXISTS auth.mfa_factors CASCADE;
DROP TABLE IF EXISTS auth.one_time_tokens CASCADE;
DROP TABLE IF EXISTS auth.refresh_tokens CASCADE;
DROP TABLE IF EXISTS auth.saml_providers CASCADE;
DROP TABLE IF EXISTS auth.saml_relay_states CASCADE;
DROP TABLE IF EXISTS auth.schema_migrations CASCADE;
DROP TABLE IF EXISTS auth.sessions CASCADE;
DROP TABLE IF EXISTS auth.sso_domains CASCADE;
DROP TABLE IF EXISTS auth.sso_providers CASCADE;
DROP TABLE IF EXISTS auth.users CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS auth.aal_level CASCADE;
DROP TYPE IF EXISTS auth.code_challenge_method CASCADE;
DROP TYPE IF EXISTS auth.factor_status CASCADE;
DROP TYPE IF EXISTS auth.factor_type CASCADE;
DROP TYPE IF EXISTS auth.one_time_token_type CASCADE;

-- Create ENUM types
CREATE TYPE auth.aal_level AS ENUM ('aal1', 'aal2', 'aal3');
CREATE TYPE auth.code_challenge_method AS ENUM ('s256', 'plain');
CREATE TYPE auth.factor_status AS ENUM ('unverified', 'verified');
CREATE TYPE auth.factor_type AS ENUM ('totp', 'webauthn', 'phone');
CREATE TYPE auth.one_time_token_type AS ENUM (
  'confirmation_token',
  'reauthentication_token',
  'recovery_token',
  'email_change_token_new',
  'email_change_token_current',
  'phone_change_token'
);

-- Create tables
CREATE TABLE auth.audit_log_entries (
  instance_id UUID,
  id UUID PRIMARY KEY,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  ip_address VARCHAR(64) DEFAULT ''
);

CREATE TABLE auth.flow_state (
  id UUID PRIMARY KEY,
  user_id UUID,
  auth_code TEXT NOT NULL,
  code_challenge_method auth.code_challenge_method NOT NULL,
  code_challenge TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  provider_access_token TEXT,
  provider_refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  authentication_method TEXT NOT NULL,
  auth_code_issued_at TIMESTAMPTZ
);

CREATE TABLE auth.identities (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  provider_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  identity_data JSONB NOT NULL,
  provider TEXT NOT NULL,
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  email TEXT,
  CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider)
);

CREATE TABLE auth.instances (
  id UUID PRIMARY KEY,
  uuid UUID,
  raw_base_config TEXT,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4')
);

CREATE TABLE auth.mfa_amr_claims (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  session_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  authentication_method TEXT NOT NULL,
  CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method)
);

CREATE TABLE auth.mfa_challenges (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  factor_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  verified_at TIMESTAMPTZ,
  ip_address INET NOT NULL,
  otp_code TEXT,
  web_authn_session_data JSONB
);

CREATE TABLE auth.mfa_factors (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL,
  friendly_name TEXT,
  factor_type auth.factor_type NOT NULL,
  status auth.factor_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  secret TEXT,
  phone TEXT,
  last_challenged_at TIMESTAMPTZ UNIQUE,
  web_authn_credential JSONB,
  web_authn_aaguid UUID,
  CONSTRAINT unique_phone_factor_per_user UNIQUE (user_id, phone)
);

CREATE TABLE auth.one_time_tokens (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL,
  token_type auth.one_time_token_type NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  relates_to TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  CONSTRAINT one_time_tokens_user_id_token_type_unique UNIQUE (user_id, token_type)
);

CREATE TABLE auth.refresh_tokens (
  instance_id UUID,
  id BIGSERIAL PRIMARY KEY,
  token TEXT UNIQUE,
  user_id TEXT,
  revoked BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  parent TEXT,
  session_id UUID
);

CREATE TABLE auth.saml_providers (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  sso_provider_id UUID NOT NULL,
  entity_id TEXT UNIQUE NOT NULL,
  metadata_xml TEXT NOT NULL,
  metadata_url TEXT,
  attribute_mapping JSONB,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  name_id_format TEXT
);

CREATE TABLE auth.saml_relay_states (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  sso_provider_id UUID NOT NULL,
  request_id TEXT NOT NULL,
  for_email TEXT,
  redirect_to TEXT,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  flow_state_id UUID
);

CREATE TABLE auth.schema_migrations (
  version TEXT PRIMARY KEY
);

CREATE TABLE auth.sessions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  factor_id UUID,
  aal auth.aal_level,
  not_after TIMESTAMPTZ,
  refreshed_at TIMESTAMP,
  user_agent TEXT,
  ip INET,
  tag TEXT
);

CREATE TABLE auth.sso_domains (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  sso_provider_id UUID NOT NULL,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4')
);

CREATE TABLE auth.sso_providers (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  resource_id TEXT,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4')
);

CREATE TABLE auth.users (
  instance_id UUID,
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  aud VARCHAR(255),
  role VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  encrypted_password VARCHAR(255),
  email_confirmed_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  confirmation_token VARCHAR(255),
  confirmation_sent_at TIMESTAMPTZ,
  recovery_token VARCHAR(255),
  recovery_sent_at TIMESTAMPTZ,
  email_change_token_new VARCHAR(255),
  email_change VARCHAR(255),
  email_change_sent_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB,
  is_super_admin BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
  phone VARCHAR(255) UNIQUE,
  phone_confirmed_at TIMESTAMPTZ,
  phone_change VARCHAR(255) DEFAULT '',
  phone_change_token VARCHAR(255) DEFAULT '',
  phone_change_sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ DEFAULT LEAST(email_confirmed_at, phone_confirmed_at),
  email_change_token_current VARCHAR(255) DEFAULT '',
  email_change_confirm_status SMALLINT DEFAULT 0,
  banned_until TIMESTAMPTZ,
  reauthentication_token VARCHAR(255) DEFAULT '',
  reauthentication_sent_at TIMESTAMPTZ,
  is_sso_user BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  is_anonymous BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries(instance_id);
CREATE INDEX idx_auth_code ON auth.flow_state(auth_code);
CREATE INDEX idx_user_id_auth_method ON auth.flow_state(user_id, authentication_method);
CREATE INDEX idx_identities_email ON auth.identities(email);
CREATE INDEX idx_identities_user_id ON auth.identities(user_id);
CREATE INDEX idx_mfa_factors_user ON auth.mfa_factors(user_id);
CREATE INDEX idx_mfa_challenge_created_at ON auth.mfa_challenges(created_at DESC);
CREATE INDEX idx_refresh_tokens_instance_id ON auth.refresh_tokens(instance_id);
CREATE INDEX idx_refresh_tokens_instance_id_user_id ON auth.refresh_tokens(instance_id, user_id);
CREATE INDEX idx_refresh_tokens_parent ON auth.refresh_tokens(parent);
CREATE INDEX idx_refresh_tokens_session_id ON auth.refresh_tokens(session_id, revoked);
CREATE INDEX idx_refresh_tokens_updated ON auth.refresh_tokens(updated_at DESC);
CREATE INDEX idx_saml_providers_sso_provider ON auth.saml_providers(sso_provider_id);
CREATE INDEX idx_saml_relay_states_created_at ON auth.saml_relay_states(created_at DESC);
CREATE INDEX idx_saml_relay_states_for_email ON auth.saml_relay_states(for_email);
CREATE INDEX idx_saml_relay_states_sso_provider ON auth.saml_relay_states(sso_provider_id);
CREATE INDEX idx_sessions_not_after ON auth.sessions(not_after DESC);
CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_sso_domains_sso_provider ON auth.sso_domains(sso_provider_id);
CREATE INDEX idx_users_instance_id ON auth.users(instance_id);
CREATE INDEX idx_users_instance_id_email ON auth.users(instance_id, email);

-- Add foreign key constraints
ALTER TABLE auth.identities
  ADD CONSTRAINT identities_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE auth.mfa_factors
  ADD CONSTRAINT mfa_factors_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE auth.sessions
  ADD CONSTRAINT sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read for authenticated users" ON auth.audit_log_entries
  FOR SELECT USING (auth.role() = 'authenticated');

-- Flow state policies
CREATE POLICY "Enable insert for anon" ON auth.flow_state
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for anon" ON auth.flow_state
  FOR SELECT USING (true);
CREATE POLICY "Enable delete for anon" ON auth.flow_state
  FOR DELETE USING (true);

-- Identities policies
CREATE POLICY "User can manage their own identities" ON auth.identities
  FOR ALL USING (auth.uid() = user_id);

-- MFA policies
CREATE POLICY "User can manage their own factors" ON auth.mfa_factors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "User can manage their own challenges" ON auth.mfa_challenges
  FOR ALL USING (
    factor_id IN (
      SELECT id FROM auth.mfa_factors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "User can manage their own AMR claims" ON auth.mfa_amr_claims
  FOR ALL USING (
    session_id IN (
      SELECT id FROM auth.sessions WHERE user_id = auth.uid()
    )
  );

-- One time token policies
CREATE POLICY "User can manage their own tokens" ON auth.one_time_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Session policies
CREATE POLICY "User can manage their own sessions" ON auth.sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public users can view their own refresh tokens" ON auth.refresh_tokens
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM auth.sessions WHERE user_id = auth.uid()
    )
  );

-- User policies
CREATE POLICY "Users can view their own data" ON auth.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON auth.users
  FOR UPDATE USING (auth.uid() = id);

-- SSO policies
CREATE POLICY "Service role only" ON auth.sso_providers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON auth.sso_domains
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON auth.saml_providers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON auth.saml_relay_states
  FOR ALL USING (auth.role() = 'service_role');

-- Instance policies
CREATE POLICY "Service role only" ON auth.instances
  FOR ALL USING (auth.role() = 'service_role');

-- Schema migrations policies
CREATE POLICY "Service role only" ON auth.schema_migrations
  FOR ALL USING (auth.role() = 'service_role');

-- Create auth functions
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS UUID 
LANGUAGE SQL 
STABLE
AS $$
  SELECT 
    COALESCE(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )::UUID
$$;

CREATE OR REPLACE FUNCTION auth.role() 
RETURNS TEXT 
LANGUAGE SQL 
STABLE
AS $$
  SELECT 
    COALESCE(
      current_setting('request.jwt.claim.role', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'role')
    )::TEXT
$$;

-- Create trigger functions
CREATE OR REPLACE FUNCTION auth.check_role_exists()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = NEW.role) THEN
    RAISE foreign_key_violation USING MESSAGE = 'Invalid role';
  END IF;
  RETURN NEW;
END
$$;

-- Create triggers
CREATE TRIGGER ensure_user_role_exists
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE auth.check_role_exists();

-- Grant permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO authenticated;

-- Comment on schema
COMMENT ON SCHEMA auth IS 'Auth tables for Supabase authentication';