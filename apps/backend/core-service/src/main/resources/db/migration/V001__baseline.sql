-- V001__baseline.sql — captures the schema as built by Hibernate ddl-auto=update against
-- current entities as of the migration/seed-data standardization plan's Phase 1
-- (docs/plans/Database-Migrations-and-Seed-Data-Plan.md), generated via:
--   pg_dump --schema-only --no-owner --no-privileges --no-comments -d busmate_core
-- then trimmed of pg_dump's psql-only meta-commands and session-level SET statements
-- so it is plain, portable Postgres SQL. Flyway adopts this as version 1 via
-- baseline-on-migrate/baseline-version (see application.yml). Do not hand-edit; any
-- further schema change is a new V00x migration, never an edit to this file.

--
-- Name: bus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bus (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    capacity integer NOT NULL,
    facilities jsonb,
    model character varying(255),
    ntc_registration_number character varying(255) NOT NULL,
    plate_number character varying(255) NOT NULL,
    seat_layout jsonb,
    status character varying(255) NOT NULL,
    operator_id uuid NOT NULL,
    CONSTRAINT bus_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'inactive'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: bus_passenger_service_permit_assignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bus_passenger_service_permit_assignment (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    end_date date,
    request_status character varying(255),
    start_date date NOT NULL,
    status character varying(255) NOT NULL,
    bus_id uuid NOT NULL,
    passenger_service_permit_id uuid NOT NULL,
    CONSTRAINT bus_passenger_service_permit_assignment_request_status_check CHECK (((request_status)::text = ANY ((ARRAY['PENDING'::character varying, 'ACCEPTED'::character varying, 'REJECTED'::character varying])::text[]))),
    CONSTRAINT bus_passenger_service_permit_assignment_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'inactive'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: operator; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operator (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    name character varying(255) NOT NULL,
    operator_type character varying(255) NOT NULL,
    region character varying(255),
    status character varying(255) NOT NULL,
    user_id uuid,
    CONSTRAINT operator_operator_type_check CHECK (((operator_type)::text = ANY ((ARRAY['PRIVATE'::character varying, 'CTB'::character varying])::text[]))),
    CONSTRAINT operator_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'inactive'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: passenger_service_permit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.passenger_service_permit (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    expiry_date date,
    issue_date date NOT NULL,
    maximum_bus_assigned integer NOT NULL,
    permit_number character varying(255) NOT NULL,
    permit_type character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    operator_id uuid NOT NULL,
    route_group_id uuid NOT NULL,
    CONSTRAINT passenger_service_permit_permit_type_check CHECK (((permit_type)::text = ANY ((ARRAY['NORMAL'::character varying, 'SEMI_LUXURY'::character varying, 'LUXURY'::character varying, 'EXTRA_LUXURY_NORMALWAY'::character varying, 'EXTRA_LUXURY_HIGHWAY'::character varying])::text[]))),
    CONSTRAINT passenger_service_permit_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'inactive'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: route; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.route (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    description character varying(255),
    direction character varying(255),
    distance_km double precision,
    estimated_duration_minutes integer,
    name character varying(255) NOT NULL,
    name_sinhala character varying(255),
    name_tamil character varying(255),
    road_type character varying(255),
    route_number character varying(255),
    route_through character varying(255),
    route_through_sinhala character varying(255),
    route_through_tamil character varying(255),
    end_stop_id uuid,
    route_group_id uuid,
    start_stop_id uuid,
    CONSTRAINT route_direction_check CHECK (((direction)::text = ANY ((ARRAY['OUTBOUND'::character varying, 'INBOUND'::character varying])::text[]))),
    CONSTRAINT route_road_type_check CHECK (((road_type)::text = ANY ((ARRAY['NORMALWAY'::character varying, 'EXPRESSWAY'::character varying])::text[])))
);


--
-- Name: route_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.route_group (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    description character varying(255),
    name character varying(255) NOT NULL,
    name_sinhala character varying(255),
    name_tamil character varying(255)
);


--
-- Name: route_stop; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.route_stop (
    id uuid NOT NULL,
    distance_from_start_km double precision,
    distance_from_start_km_calculated double precision,
    distance_from_start_km_unverified double precision,
    stop_order integer NOT NULL,
    route_id uuid NOT NULL,
    stop_id uuid NOT NULL
);


--
-- Name: schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    description character varying(255),
    effective_end_date date,
    effective_start_date date NOT NULL,
    name character varying(255) NOT NULL,
    schedule_type character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    route_id uuid NOT NULL,
    CONSTRAINT schedule_schedule_type_check CHECK (((schedule_type)::text = ANY ((ARRAY['REGULAR'::character varying, 'SPECIAL'::character varying])::text[]))),
    CONSTRAINT schedule_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'ACTIVE'::character varying, 'INACTIVE'::character varying, 'CANCELLED'::character varying])::text[])))
);


--
-- Name: schedule_calendar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_calendar (
    id uuid NOT NULL,
    friday boolean NOT NULL,
    monday boolean NOT NULL,
    saturday boolean NOT NULL,
    sunday boolean NOT NULL,
    thursday boolean NOT NULL,
    tuesday boolean NOT NULL,
    wednesday boolean NOT NULL,
    schedule_id uuid NOT NULL
);


--
-- Name: schedule_exception; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_exception (
    id uuid NOT NULL,
    exception_date date NOT NULL,
    exception_type character varying(255) NOT NULL,
    schedule_id uuid NOT NULL,
    CONSTRAINT schedule_exception_exception_type_check CHECK (((exception_type)::text = ANY ((ARRAY['ADDED'::character varying, 'REMOVED'::character varying])::text[])))
);


--
-- Name: schedule_stop; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_stop (
    id uuid NOT NULL,
    arrival_time time(6) without time zone,
    arrival_time_calculated time(6) without time zone,
    arrival_time_unverified time(6) without time zone,
    arrival_time_unverified_by character varying(255),
    departure_time time(6) without time zone,
    departure_time_calculated time(6) without time zone,
    departure_time_unverified time(6) without time zone,
    departure_time_unverified_by character varying(255),
    stop_order integer NOT NULL,
    route_stop_id uuid NOT NULL,
    schedule_id uuid NOT NULL
);


--
-- Name: stop; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stop (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    description character varying(255),
    is_accessible boolean,
    address character varying(255),
    address_sinhala character varying(255),
    address_tamil character varying(255),
    city character varying(255),
    city_sinhala character varying(255),
    city_tamil character varying(255),
    country character varying(255),
    country_sinhala character varying(255),
    country_tamil character varying(255),
    latitude double precision,
    longitude double precision,
    state character varying(255),
    state_sinhala character varying(255),
    state_tamil character varying(255),
    zip_code character varying(255),
    name character varying(255) NOT NULL,
    name_sinhala character varying(255),
    name_tamil character varying(255)
);


--
-- Name: trip; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    version bigint,
    actual_arrival_time time(6) without time zone,
    actual_departure_time time(6) without time zone,
    conductor_id uuid,
    driver_id uuid,
    notes character varying(255),
    scheduled_arrival_time time(6) without time zone NOT NULL,
    scheduled_departure_time time(6) without time zone NOT NULL,
    status character varying(255) NOT NULL,
    trip_date date NOT NULL,
    bus_id uuid,
    passenger_service_permit_id uuid,
    schedule_id uuid NOT NULL,
    CONSTRAINT trip_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'delayed'::character varying, 'in_transit'::character varying, 'boarding'::character varying, 'departed'::character varying])::text[])))
);


--
-- Name: bus_passenger_service_permit_assignment bus_passenger_service_permit_assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bus_passenger_service_permit_assignment
    ADD CONSTRAINT bus_passenger_service_permit_assignment_pkey PRIMARY KEY (id);


--
-- Name: bus bus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bus
    ADD CONSTRAINT bus_pkey PRIMARY KEY (id);


--
-- Name: operator operator_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operator
    ADD CONSTRAINT operator_pkey PRIMARY KEY (id);


--
-- Name: passenger_service_permit passenger_service_permit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.passenger_service_permit
    ADD CONSTRAINT passenger_service_permit_pkey PRIMARY KEY (id);


--
-- Name: route_group route_group_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.route_group
    ADD CONSTRAINT route_group_pkey PRIMARY KEY (id);


--
-- Name: route route_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.route
    ADD CONSTRAINT route_pkey PRIMARY KEY (id);


--
-- Name: route_stop route_stop_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.route_stop
    ADD CONSTRAINT route_stop_pkey PRIMARY KEY (id);


--
-- Name: schedule_calendar schedule_calendar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_calendar
    ADD CONSTRAINT schedule_calendar_pkey PRIMARY KEY (id);


--
-- Name: schedule_exception schedule_exception_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_exception
    ADD CONSTRAINT schedule_exception_pkey PRIMARY KEY (id);


--
-- Name: schedule schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule
    ADD CONSTRAINT schedule_pkey PRIMARY KEY (id);


--
-- Name: schedule_stop schedule_stop_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_stop
    ADD CONSTRAINT schedule_stop_pkey PRIMARY KEY (id);


--
-- Name: stop stop_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stop
    ADD CONSTRAINT stop_pkey PRIMARY KEY (id);


--
-- Name: trip trip_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip
    ADD CONSTRAINT trip_pkey PRIMARY KEY (id);


--
-- Name: bus ukl2cfpfx7iui3jo8mwf17983ka; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bus
    ADD CONSTRAINT ukl2cfpfx7iui3jo8mwf17983ka UNIQUE (plate_number);


--
-- Name: passenger_service_permit uko9li4hjpbc32c1m8afgxjp21; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.passenger_service_permit
    ADD CONSTRAINT uko9li4hjpbc32c1m8afgxjp21 UNIQUE (permit_number);


--
-- Name: bus ukpl51827419vudsvjo5n0pfror; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bus
    ADD CONSTRAINT ukpl51827419vudsvjo5n0pfror UNIQUE (ntc_registration_number);


--
-- Name: operator ukwuq5u45fl93avvfr195fed6s; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operator
    ADD CONSTRAINT ukwuq5u45fl93avvfr195fed6s UNIQUE (user_id);


--
-- Name: trip fk7miyoext6mxl6q72hl495csot; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip
    ADD CONSTRAINT fk7miyoext6mxl6q72hl495csot FOREIGN KEY (schedule_id) REFERENCES public.schedule(id);


--
-- Name: route fkdsublvmoybr10u537rixwpsx; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.route
    ADD CONSTRAINT fkdsublvmoybr10u537rixwpsx FOREIGN KEY (start_stop_id) REFERENCES public.stop(id);


--
-- Name: schedule_stop fkgnwo6bqdu7m14ayoudvv4uesj; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_stop
    ADD CONSTRAINT fkgnwo6bqdu7m14ayoudvv4uesj FOREIGN KEY (route_stop_id) REFERENCES public.route_stop(id);


--
-- Name: bus_passenger_service_permit_assignment fkhbec0j9k95ty2vfoucfw8264q; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bus_passenger_service_permit_assignment
    ADD CONSTRAINT fkhbec0j9k95ty2vfoucfw8264q FOREIGN KEY (bus_id) REFERENCES public.bus(id);


--
-- Name: schedule_calendar fkmfwet6s1f20mcqbhm3ugqhwd8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_calendar
    ADD CONSTRAINT fkmfwet6s1f20mcqbhm3ugqhwd8 FOREIGN KEY (schedule_id) REFERENCES public.schedule(id);


--
-- Name: route_stop fkmu1b9fkhu2d4982t14wc4wjg9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.route_stop
    ADD CONSTRAINT fkmu1b9fkhu2d4982t14wc4wjg9 FOREIGN KEY (stop_id) REFERENCES public.stop(id);


--
-- Name: passenger_service_permit fkn2t1j7v9e0c5jq712xsnku27r; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.passenger_service_permit
    ADD CONSTRAINT fkn2t1j7v9e0c5jq712xsnku27r FOREIGN KEY (route_group_id) REFERENCES public.route_group(id);


--
-- Name: schedule_exception fknf1779yhwwyett4swexly6cxw; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_exception
    ADD CONSTRAINT fknf1779yhwwyett4swexly6cxw FOREIGN KEY (schedule_id) REFERENCES public.schedule(id);


--
-- Name: schedule fknijrqlnbae9vvpgj6pnaqrl0q; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule
    ADD CONSTRAINT fknijrqlnbae9vvpgj6pnaqrl0q FOREIGN KEY (route_id) REFERENCES public.route(id);


--
-- Name: route fko071ncgg9k5lfwuctn67sniok; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.route
    ADD CONSTRAINT fko071ncgg9k5lfwuctn67sniok FOREIGN KEY (route_group_id) REFERENCES public.route_group(id);


--
-- Name: route fkomof87dposk6w13dw85qlhrqu; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.route
    ADD CONSTRAINT fkomof87dposk6w13dw85qlhrqu FOREIGN KEY (end_stop_id) REFERENCES public.stop(id);


--
-- Name: trip fkptvi61dd1hao1yig3in0gvcjs; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip
    ADD CONSTRAINT fkptvi61dd1hao1yig3in0gvcjs FOREIGN KEY (bus_id) REFERENCES public.bus(id);


--
-- Name: route_stop fkrah0j8khs716aqhsqt3x5yxbw; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.route_stop
    ADD CONSTRAINT fkrah0j8khs716aqhsqt3x5yxbw FOREIGN KEY (route_id) REFERENCES public.route(id);


--
-- Name: bus fksnxwbj6jnm1dd91ypmyusdhmi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bus
    ADD CONSTRAINT fksnxwbj6jnm1dd91ypmyusdhmi FOREIGN KEY (operator_id) REFERENCES public.operator(id);


--
-- Name: bus_passenger_service_permit_assignment fkstmsu7pc5eottoc0kg07lglct; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bus_passenger_service_permit_assignment
    ADD CONSTRAINT fkstmsu7pc5eottoc0kg07lglct FOREIGN KEY (passenger_service_permit_id) REFERENCES public.passenger_service_permit(id);


--
-- Name: schedule_stop fktrm4cvjbjkh19287mlaa63l9p; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_stop
    ADD CONSTRAINT fktrm4cvjbjkh19287mlaa63l9p FOREIGN KEY (schedule_id) REFERENCES public.schedule(id);


--
-- Name: trip fkvih88rejkgngrds5dtugwdt7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip
    ADD CONSTRAINT fkvih88rejkgngrds5dtugwdt7 FOREIGN KEY (passenger_service_permit_id) REFERENCES public.passenger_service_permit(id);


--
-- Name: passenger_service_permit fkxqrklsq3h0e6kk9i1oh1frqd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.passenger_service_permit
    ADD CONSTRAINT fkxqrklsq3h0e6kk9i1oh1frqd FOREIGN KEY (operator_id) REFERENCES public.operator(id);


