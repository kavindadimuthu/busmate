-- V001__baseline.sql — captures the schema as built by Hibernate ddl-auto=update against
-- current entities as of the migration/seed-data standardization plan's Phase 1
-- (docs/plans/Database-Migrations-and-Seed-Data-Plan.md), generated via:
--   pg_dump --schema-only --no-owner --no-privileges --no-comments -d busmate_user
-- then trimmed of pg_dump's psql-only meta-commands and session-level SET statements
-- so it is plain, portable Postgres SQL. Flyway adopts this as version 1 via
-- baseline-on-migrate/baseline-version (see application.yml). Do not hand-edit; any
-- further schema change is a new V00x migration, never an edit to this file.

--
-- Name: auth_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_audit_log (
    id uuid NOT NULL,
    action character varying(255) NOT NULL,
    actor_id uuid,
    created_at timestamp(6) with time zone,
    details character varying(255),
    user_id uuid
);


--
-- Name: auth_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_credentials (
    user_id uuid NOT NULL,
    created_at timestamp(6) with time zone,
    failed_attempts integer NOT NULL,
    locked_until timestamp(6) with time zone,
    password_hash character varying(255) NOT NULL,
    password_updated_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.one_time_tokens (
    id uuid NOT NULL,
    consumed_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone,
    expires_at timestamp(6) with time zone NOT NULL,
    token_hash character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    CONSTRAINT one_time_tokens_type_check CHECK (((type)::text = ANY ((ARRAY['EMAIL_VERIFY'::character varying, 'PASSWORD_RESET'::character varying])::text[])))
);


--
-- Name: operator_sync_outbox; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operator_sync_outbox (
    id uuid NOT NULL,
    attempts integer NOT NULL,
    created_at timestamp(6) with time zone,
    last_error text,
    name character varying(255),
    next_attempt_at timestamp(6) with time zone,
    operation character varying(255) NOT NULL,
    operator_status character varying(255),
    operator_type character varying(255),
    region character varying(255),
    sync_status character varying(255) NOT NULL,
    updated_at timestamp(6) with time zone,
    user_id uuid NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    action character varying(255) NOT NULL,
    created_at timestamp(6) with time zone,
    description character varying(255),
    name character varying(255) NOT NULL,
    resource character varying(255) NOT NULL,
    scope character varying(255)
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    family_id uuid NOT NULL,
    ip character varying(255),
    issued_at timestamp(6) with time zone,
    revoked_at timestamp(6) with time zone,
    token_hash character varying(255) NOT NULL,
    user_agent character varying(255),
    user_id uuid NOT NULL
);


--
-- Name: user_identities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_identities (
    id uuid NOT NULL,
    email character varying(255),
    linked_at timestamp(6) with time zone,
    provider character varying(255) NOT NULL,
    provider_user_id character varying(255) NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: user_permission_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permission_overrides (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone,
    expires_at timestamp(6) with time zone,
    is_granted boolean NOT NULL,
    reason character varying(255),
    updated_at timestamp(6) with time zone,
    granted_by uuid,
    permission_id uuid NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone,
    profile_data jsonb,
    updated_at timestamp(6) with time zone,
    user_id uuid NOT NULL
);


--
-- Name: user_type_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_type_permissions (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone,
    is_granted boolean,
    permission_id uuid NOT NULL,
    user_type_id uuid NOT NULL
);


--
-- Name: user_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_types (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone,
    description character varying(255),
    display_name character varying(255) NOT NULL,
    is_active boolean,
    is_system boolean,
    name character varying(255) NOT NULL,
    updated_at timestamp(6) with time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id uuid NOT NULL,
    account_status character varying(255),
    created_at timestamp(6) with time zone,
    email character varying(255) NOT NULL,
    full_name character varying(255),
    is_email_verified boolean,
    last_login_at timestamp(6) with time zone,
    phone_number character varying(255),
    updated_at timestamp(6) with time zone,
    username character varying(255),
    created_by uuid,
    user_type_id uuid NOT NULL
);


--
-- Name: auth_audit_log auth_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_audit_log
    ADD CONSTRAINT auth_audit_log_pkey PRIMARY KEY (id);


--
-- Name: auth_credentials auth_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_credentials
    ADD CONSTRAINT auth_credentials_pkey PRIMARY KEY (user_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: operator_sync_outbox operator_sync_outbox_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operator_sync_outbox
    ADD CONSTRAINT operator_sync_outbox_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: users uk6dotkott2kjsp8vw4d0m25fb7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);


--
-- Name: user_types uk8e5n03eqtc9alk98s41o00u5v; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_types
    ADD CONSTRAINT uk8e5n03eqtc9alk98s41o00u5v UNIQUE (name);


--
-- Name: user_profiles uke5h89rk3ijvdmaiig4srogdc6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT uke5h89rk3ijvdmaiig4srogdc6 UNIQUE (user_id);


--
-- Name: one_time_tokens ukmpff7g7kr2xx0gnhgai375j94; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.one_time_tokens
    ADD CONSTRAINT ukmpff7g7kr2xx0gnhgai375j94 UNIQUE (token_hash);


--
-- Name: refresh_tokens uko2mlirhldriil2y7krapq4frt; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT uko2mlirhldriil2y7krapq4frt UNIQUE (token_hash);


--
-- Name: permissions ukpnvtwliis6p05pn6i3ndjrqt2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT ukpnvtwliis6p05pn6i3ndjrqt2 UNIQUE (name);


--
-- Name: users ukr43af9ap4edm43mmtq01oddj6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT ukr43af9ap4edm43mmtq01oddj6 UNIQUE (username);


--
-- Name: user_identities uq_identity_provider_subject; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_identities
    ADD CONSTRAINT uq_identity_provider_subject UNIQUE (provider, provider_user_id);


--
-- Name: user_identities user_identities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_identities
    ADD CONSTRAINT user_identities_pkey PRIMARY KEY (id);


--
-- Name: user_permission_overrides user_permission_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permission_overrides
    ADD CONSTRAINT user_permission_overrides_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_type_permissions user_type_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_type_permissions
    ADD CONSTRAINT user_type_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_types user_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_types
    ADD CONSTRAINT user_types_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: idx_one_time_tokens_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_one_time_tokens_user_type ON public.one_time_tokens USING btree (user_id, type);


--
-- Name: idx_refresh_tokens_family; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_family ON public.refresh_tokens USING btree (family_id);


--
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id);


--
-- Name: user_permission_overrides fkf0kyowb7x7w10k5wd0vns5b8y; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permission_overrides
    ADD CONSTRAINT fkf0kyowb7x7w10k5wd0vns5b8y FOREIGN KEY (granted_by) REFERENCES public.users(user_id);


--
-- Name: user_type_permissions fkhh5xvwdfp6l0tei6ph7msj635; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_type_permissions
    ADD CONSTRAINT fkhh5xvwdfp6l0tei6ph7msj635 FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: users fkibk1e3kaxy5sfyeekp8hbhnim; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fkibk1e3kaxy5sfyeekp8hbhnim FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: user_profiles fkjcad5nfve11khsnpwj1mv8frj; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT fkjcad5nfve11khsnpwj1mv8frj FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: user_permission_overrides fkkppc8es7a6ro6cey0regbxiit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permission_overrides
    ADD CONSTRAINT fkkppc8es7a6ro6cey0regbxiit FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: user_type_permissions fkkqwr6ubbb8nr4x9o4a3m6m5u4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_type_permissions
    ADD CONSTRAINT fkkqwr6ubbb8nr4x9o4a3m6m5u4 FOREIGN KEY (user_type_id) REFERENCES public.user_types(id);


--
-- Name: user_permission_overrides fkl41jpmfrwb159194d70o3vw33; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permission_overrides
    ADD CONSTRAINT fkl41jpmfrwb159194d70o3vw33 FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: users fkp0utx8kvsuc78nb39dgyg6oko; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fkp0utx8kvsuc78nb39dgyg6oko FOREIGN KEY (user_type_id) REFERENCES public.user_types(id);


