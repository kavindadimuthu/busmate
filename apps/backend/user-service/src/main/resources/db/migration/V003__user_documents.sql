-- INC-019: scanned documents of a conductor (NIC, licences, clearances), kept by their operator.
--
-- Personal data: the bytes live in private object storage (ADR-009) and are only ever served to
-- the conductor, their own operator and MOT/admin, as sandboxed attachments. The storage key is
-- derived by the server from user and document ids, never taken from a client.
CREATE TABLE public.user_documents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    document_type character varying(40) NOT NULL,
    title character varying(200),
    storage_key character varying(300) NOT NULL,
    content_type character varying(100) NOT NULL,
    size_bytes bigint NOT NULL,
    expiry_date date,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_documents_pkey PRIMARY KEY (id),
    CONSTRAINT user_documents_user_fk FOREIGN KEY (user_id) REFERENCES public.users(user_id),
    CONSTRAINT user_documents_type_check CHECK (document_type IN ('NIC_FRONT', 'NIC_BACK',
        'DRIVING_LICENCE', 'CONDUCTOR_LICENCE', 'POLICE_CLEARANCE', 'MEDICAL_CERTIFICATE', 'OTHER'))
);

CREATE INDEX user_documents_user_idx ON public.user_documents (user_id);
