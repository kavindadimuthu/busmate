-- INC-011, dev profile only. V002 gives every bus a NORMAL service class, because guessing a fare
-- tier for real fleet data would silently misprice seats. The demo fleet is different: V904 states
-- each bus's intended permit class in prose, so setting it here is recording a known fact, not
-- inferring one — and without it every demo journey prices as NORMAL regardless of the bus.
--
-- Bus UUIDs from docs/dev-seed-contract.md; see V900__demo_operators.sql for the scenario.
UPDATE bus SET service_class = 'SEMI_LUXURY'
 WHERE id IN ('00000000-0000-0000-0000-000000010301',
              '00000000-0000-0000-0000-000000010302');

UPDATE bus SET service_class = 'LUXURY'
 WHERE id IN ('00000000-0000-0000-0000-000000010303',
              '00000000-0000-0000-0000-000000010304');

UPDATE bus SET service_class = 'NORMAL'
 WHERE id IN ('00000000-0000-0000-0000-000000010305',
              '00000000-0000-0000-0000-000000010306');
