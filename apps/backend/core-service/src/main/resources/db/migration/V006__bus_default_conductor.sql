-- INC-019 (design R5): the conductor who usually works a bus.
--
-- A convenience only: it pre-fills trip assignments. The trip's own conductor_id stays the record
-- the conductor app, tickets and MOT read. The id is a user-service account (no FK across
-- services); core-service checks it with user-service when it is set.
ALTER TABLE public.bus
    ADD COLUMN default_conductor_id uuid;
