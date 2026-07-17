// Waypoints for the device simulator, matching the demo routes/stops seeded by core-service
// (docs/dev-seed-contract.md, "Demo routes"/"Demo stops" sections). Coordinates are approximate
// real-world locations for these towns — precise enough for a believable demo, not surveyed.
export const ROUTES = {
  'colombo-kandy': {
    name: 'Colombo Fort -> Kandy (route ...010101)',
    waypoints: [
      { lat: 6.9344, lng: 79.8428 }, // Colombo Fort (Central Bus Stand) — stop ...010201
      { lat: 7.0087, lng: 79.9508 }, // Kadawatha — stop ...010202
      { lat: 7.2513, lng: 80.3464 }, // Kegalle — stop ...010203
      { lat: 7.2906, lng: 80.6337 }, // Kandy (Goods Shed Bus Stand) — stop ...010204
    ],
  },
  'colombo-galle': {
    name: 'Colombo Fort -> Galle (route ...010103)',
    waypoints: [
      { lat: 6.9344, lng: 79.8428 }, // Colombo Fort — stop ...010201
      { lat: 6.5854, lng: 79.9607 }, // Kalutara — stop ...010205
      { lat: 6.2356, lng: 80.0540 }, // Ambalangoda — stop ...010206
      { lat: 6.0535, lng: 80.2210 }, // Galle (Bus Stand) — stop ...010207
    ],
  },
  'colombo-negombo': {
    name: 'Colombo Fort -> Negombo (route ...010105)',
    waypoints: [
      { lat: 6.9344, lng: 79.8428 }, // Colombo Fort — stop ...010201
      { lat: 6.9895, lng: 79.8916 }, // Wattala — stop ...010208
      { lat: 7.2086, lng: 79.8380 }, // Negombo (Bus Stand) — stop ...010209
    ],
  },
};
