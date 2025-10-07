/**
 * Test data fixtures for Stop API testing
 * Includes realistic Sri Lankan bus stop data for comprehensive API testing
 */

// Valid Sri Lankan locations for testing
const validStopData = {
  colomboCentral: {
    name: "Colombo Central Bus Terminal",
    description: "Main intercity bus terminal in Colombo with modern facilities",
    location: {
      latitude: 6.9344,
      longitude: 79.8428,
      address: "Olcott Mawatha",
      city: "Colombo",
      state: "Western Province",
      zipCode: "00100",
      country: "Sri Lanka"
    },
    isAccessible: true
  },

  kandyTerminal: {
    name: "Kandy Bus Terminal",
    description: "Central bus terminal serving hill country routes",
    location: {
      latitude: 7.2906,
      longitude: 80.6337,
      address: "Temple Street",
      city: "Kandy",
      state: "Central Province",
      zipCode: "20000",
      country: "Sri Lanka"
    },
    isAccessible: true
  },

  galleStation: {
    name: "Galle Bus Station",
    description: "Historic bus station in southern coastal city",
    location: {
      latitude: 6.0535,
      longitude: 80.2210,
      address: "Main Street",
      city: "Galle",
      state: "Southern Province",
      zipCode: "80000",
      country: "Sri Lanka"
    },
    isAccessible: false
  },

  peradenyiaJunction: {
    name: "Peradeniya Junction",
    description: "Important transport hub near University of Peradeniya",
    location: {
      latitude: 7.2513,
      longitude: 80.5979,
      address: "Kandy-Peradeniya Road",
      city: "Peradeniya",
      state: "Central Province",
      zipCode: "20400",
      country: "Sri Lanka"
    },
    isAccessible: true
  },

  jaffnaStation: {
    name: "Jaffna Bus Station",
    description: "Main bus terminal serving northern region",
    location: {
      latitude: 9.6615,
      longitude: 80.0255,
      address: "Hospital Road",
      city: "Jaffna",
      state: "Northern Province",
      zipCode: "40000",
      country: "Sri Lanka"
    },
    isAccessible: false
  }
};

// Test data for different scenarios
const testScenarios = {
  // Valid creation scenarios
  validCreation: [
    {
      name: "Test Stop Alpha",
      description: "Test stop for automated testing - Alpha location",
      location: {
        latitude: 6.9271,
        longitude: 79.8612,
        address: "123 Test Street Alpha",
        city: "TestCity Alpha",
        state: "Test Province",
        zipCode: "12345",
        country: "Sri Lanka"
      },
      isAccessible: true
    },
    {
      name: "Test Stop Beta",
      description: "Test stop for automated testing - Beta location",
      location: {
        latitude: 7.0000,
        longitude: 80.0000,
        address: "456 Test Avenue Beta",
        city: "TestCity Beta", 
        state: "Test Province",
        zipCode: "67890",
        country: "Sri Lanka"
      },
      isAccessible: false
    }
  ],

  // Invalid data scenarios for validation testing
  invalidData: {
    missingName: {
      description: "Stop without name",
      location: {
        latitude: 6.9271,
        longitude: 79.8612,
        address: "No Name Street",
        city: "Test City",
        state: "Test Province",
        zipCode: "12345",
        country: "Sri Lanka"
      },
      isAccessible: true
    },

    missingLocation: {
      name: "Stop Without Location",
      description: "Stop missing location data",
      isAccessible: true
    },

    invalidCoordinates: {
      name: "Invalid Coordinates Stop",
      description: "Stop with invalid GPS coordinates",
      location: {
        latitude: 200.0, // Invalid latitude
        longitude: 200.0, // Invalid longitude
        address: "Invalid Coords Street",
        city: "Test City",
        state: "Test Province",
        zipCode: "12345",
        country: "Sri Lanka"
      },
      isAccessible: true
    },

    emptyName: {
      name: "",
      description: "Stop with empty name",
      location: {
        latitude: 6.9271,
        longitude: 79.8612,
        address: "Empty Name Street",
        city: "Test City",
        state: "Test Province",
        zipCode: "12345",
        country: "Sri Lanka"
      },
      isAccessible: true
    }
  },

  // Update scenarios
  updateData: {
    nameChange: {
      name: "Updated Stop Name",
      description: "Description updated during testing",
      location: {
        latitude: 6.9271,
        longitude: 79.8612,
        address: "123 Updated Street",
        city: "Updated City",
        state: "Updated Province", 
        zipCode: "54321",
        country: "Sri Lanka"
      },
      isAccessible: false
    }
  }
};

// Search test data
const searchTestData = {
  searchTerms: [
    { term: "Colombo", expectedCount: ">=1" },
    { term: "Central", expectedCount: ">=1" },
    { term: "Bus", expectedCount: ">=1" },
    { term: "Western Province", expectedCount: ">=1" },
    { term: "NonExistentLocation", expectedCount: "0" },
    { term: "Terminal", expectedCount: ">=2" }
  ]
};

// Pagination test scenarios
const paginationTestData = {
  scenarios: [
    { page: 0, size: 5 },
    { page: 0, size: 10 },
    { page: 1, size: 5 },
    { page: 0, size: 100 }, // Max page size
    { page: 0, size: 200 }, // Over max (should be capped at 100)
  ],
  
  sortingOptions: [
    { sortBy: "name", sortDir: "asc" },
    { sortBy: "name", sortDir: "desc" },
    { sortBy: "createdAt", sortDir: "desc" },
    { sortBy: "city", sortDir: "asc" },
    { sortBy: "state", sortDir: "asc" }
  ]
};

// CSV import test data
const csvImportData = {
  validCsv: `name,description,latitude,longitude,address,city,state,zipCode,country,isAccessible
Import Test Stop 1,CSV imported stop 1,6.9271,79.8612,CSV Street 1,CSV City 1,CSV Province,11111,Sri Lanka,true
Import Test Stop 2,CSV imported stop 2,7.0000,80.0000,CSV Street 2,CSV City 2,CSV Province,22222,Sri Lanka,false`,

  invalidCsv: `name,description,latitude,longitude,address,city,state,zipCode,country,isAccessible
,CSV imported stop 1,6.9271,79.8612,CSV Street 1,CSV City 1,CSV Province,11111,Sri Lanka,true
Import Test Stop 2,,999.0,999.0,CSV Street 2,CSV City 2,CSV Province,22222,Sri Lanka,invalid`
};

// Helper functions
function createRandomStop(suffix = '') {
  const random = Math.floor(Math.random() * 10000);
  return {
    name: `Random Stop ${random}${suffix}`,
    description: `Randomly generated stop for testing ${random}`,
    location: {
      latitude: 6.9271 + (Math.random() - 0.5) * 0.1, // Small variation around Colombo
      longitude: 79.8612 + (Math.random() - 0.5) * 0.1,
      address: `${random} Random Street`,
      city: `RandomCity${random}`,
      state: "Test Province",
      zipCode: String(random).padStart(5, '0'),
      country: "Sri Lanka"
    },
    isAccessible: Math.random() > 0.5
  };
}

function createStopWithOverrides(baseStop, overrides = {}) {
  return {
    ...JSON.parse(JSON.stringify(baseStop)), // Deep clone
    ...overrides,
    location: {
      ...baseStop.location,
      ...(overrides.location || {})
    }
  };
}

// Export all test data
module.exports = {
  validStopData,
  testScenarios,
  searchTestData,
  paginationTestData,
  csvImportData,
  createRandomStop,
  createStopWithOverrides
};