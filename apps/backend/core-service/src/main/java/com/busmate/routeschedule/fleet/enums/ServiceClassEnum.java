package com.busmate.routeschedule.fleet.enums;

/**
 * The fare tier a bus is licensed and equipped to run at (INC-011).
 *
 * These constants are the five columns `base_fare` prices, named identically on purpose: the tier
 * a passenger is charged at is a recorded property of the bus, never inferred from its facilities.
 * Adding one means adding a `base_fare` column and widening `bus_service_class_check` in a new
 * migration — deliberate friction, because it changes what a seat costs.
 */
public enum ServiceClassEnum {
    NORMAL,
    SEMI_LUXURY,
    LUXURY,
    SUPER_LUXURY,
    EXPRESSWAY_SUPER_LUXURY
}
