// What every Google map in this app shares. The script must be loaded with the same key and options wherever it is
// loaded, so both live here.
export const GOOGLE_MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? "";
export const HAS_MAPS_KEY = GOOGLE_MAPS_KEY.trim().length > 0;
export const NO_LIBRARIES: never[] = [];
