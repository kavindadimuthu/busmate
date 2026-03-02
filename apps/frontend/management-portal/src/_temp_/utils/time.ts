// =============================================================================
// Mock Location Tracking — Time Utilities
// =============================================================================
// Helper functions for the 1-hour looping time window and deterministic
// random number generation.

/**
 * Get the current minute within the 1-hour looping window (0–59).
 * Every hour the simulation resets: minute 0 = top of the hour.
 */
export function getCurrentMinuteInHour(now: Date = new Date()): number {
    return now.getMinutes() + now.getSeconds() / 60;
}

/**
 * Get fractional seconds contribution for sub-minute precision.
 * Returns a value between 0 and 1 representing progress through the current minute.
 */
export function getSecondsFraction(now: Date = new Date()): number {
    return now.getSeconds() / 60 + now.getMilliseconds() / 60000;
}

/**
 * Parse a "HH:mm" time string to total minutes from midnight.
 */
export function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Seeded pseudo-random number generator (deterministic).
 * Same seed always produces the same output in [0, 1).
 */
export function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

/**
 * Create a daily-deterministic random factor for a given bus.
 * Same bus + same day always yields the same value, allowing
 * consistent delay / passenger variations per day.
 *
 * @param busId  Bus identifier
 * @param factor Additional differentiator (e.g. 'delay', 'passengers')
 * @returns      Value in [0, 1)
 */
export function getDailyRandomFactor(
    busId: string,
    factor: string = ''
): number {
    const today = new Date();
    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const seedString = `${busId}-${dayOfYear}-${factor}`;
    let seed = 0;
    for (let i = 0; i < seedString.length; i++) {
        seed = ((seed << 5) - seed + seedString.charCodeAt(i)) | 0;
    }
    return seededRandom(seed);
}
