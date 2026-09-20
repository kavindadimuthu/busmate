package com.busmate.routeschedule.shared.util;

/** Small geo helpers shared across features that don't need a full spatial extension. */
public final class GeoUtils {

    private static final double EARTH_RADIUS_METERS = 6_371_000.0;

    private GeoUtils() {
    }

    /** Great-circle distance in metres between two lat/lng points (Haversine formula). */
    public static double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }

    /** A rough degrees-of-latitude box covering {@code radiusMeters} in every direction. */
    public static double metersToLatitudeDegrees(double radiusMeters) {
        return radiusMeters / 111_320.0;
    }

    /** A rough degrees-of-longitude box covering {@code radiusMeters}, widened near the equator. */
    public static double metersToLongitudeDegrees(double radiusMeters, double atLatitude) {
        double metersPerDegree = 111_320.0 * Math.cos(Math.toRadians(atLatitude));
        return radiusMeters / Math.max(metersPerDegree, 1.0);
    }
}
