import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bus, 
  Loader2 
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import SearchForm from "@/components/search/SearchForm";
import FilterSidebar from "@/components/search/FilterSidebar";
import BusCard from "@/components/search/BusCard";
import { PassengerQueryService } from "@/generated/api-client/route-management";
import type { 
  BusResult,
  FindMyBusResponse
} from "@/generated/api-client/route-management";

interface FilterState {
  departureTimeFrom: string;
  routeNumber: string;
  roadType: 'NORMALWAY' | 'EXPRESSWAY' | '';
  sortBy: string;
}

interface SearchParams {
  fromStopId?: string;
  toStopId?: string;
  fromName?: string;
  toName?: string;
  fromText?: string;
  toText?: string;
  date?: string;
}

const FindMyBusPage = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [busResults, setBusResults] = useState<BusResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [fromStopName, setFromStopName] = useState<string>('');
  const [toStopName, setToStopName] = useState<string>('');
  
  // Initialize filters
  const [filters, setFilters] = useState<FilterState>({
    departureTimeFrom: '',
    routeNumber: '',
    roadType: '',
    sortBy: 'departure'
  });

  // Parse URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const fromStopId = urlParams.get("fromStopId") || undefined;
    const toStopId = urlParams.get("toStopId") || undefined;
    const fromName = urlParams.get("fromName") || undefined;
    const toName = urlParams.get("toName") || undefined;
    const fromText = urlParams.get("fromText") || undefined;
    const toText = urlParams.get("toText") || undefined;
    const date = urlParams.get("date") || undefined;
    
    setSearchParams({ 
      fromStopId, 
      toStopId, 
      fromName, 
      toName, 
      fromText, 
      toText,
      date
    });
  }, [location.search]);

  // Filter function to only include REALTIME and SCHEDULE data
  const filterResultsByDataMode = (results: BusResult[]): BusResult[] => {
    return results.filter(bus => 
      bus.dataMode === 'REALTIME' || bus.dataMode === 'SCHEDULE'
    );
  };

  // Search buses function
  const searchBuses = async () => {
    if (!searchParams.fromStopId || !searchParams.toStopId) {
      setError('Please select valid stops for your journey');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: FindMyBusResponse = await PassengerQueryService.findMyBus(
        searchParams.fromStopId,
        searchParams.toStopId,
        searchParams.date || undefined,
        filters.departureTimeFrom || undefined,
        filters.routeNumber || undefined,
        filters.roadType || undefined,
        true, // includeScheduledData
        false  // includeRouteData - set to false to exclude STATIC route data
      );

      // Filter results to only include REALTIME and SCHEDULE data modes
      const filteredResults = filterResultsByDataMode(response.results || []);
      
      setBusResults(filteredResults);
      setTotalResults(filteredResults.length);
      
      // Store stop names from response
      if (response.fromStop?.name) setFromStopName(response.fromStop.name);
      if (response.toStop?.name) setToStopName(response.toStop.name);
    } catch (err) {
      console.error('Error searching buses:', err);
      setError('Failed to search buses. Please try again.');
      setBusResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // Search when params or filters change
  useEffect(() => {
    if (searchParams.fromStopId && searchParams.toStopId) {
      searchBuses();
    }
  }, [searchParams, filters]);

  // Helper to get departure time for sorting
  const getDepartureTimeForSort = (bus: BusResult) => {
    if (bus.dataMode === 'REALTIME' && bus.actualDepartureTime) {
      return bus.actualDepartureTime;
    }
    if (bus.dataMode === 'SCHEDULE' && bus.scheduledDepartureAtOrigin) {
      return bus.scheduledDepartureAtOrigin;
    }
    return null;
  };

  // Sort buses based on sortBy filter
  const sortedBuses = [...busResults].sort((a, b) => {
    switch (filters.sortBy) {
      case 'duration':
        return (a.estimatedDurationMinutes || 0) - (b.estimatedDurationMinutes || 0);
      case 'distance':
        return (a.distanceKm || 0) - (b.distanceKm || 0);
      case 'dataMode':
        // Sort by data mode priority: REALTIME > SCHEDULE > STATIC
        const modeOrder = { REALTIME: 0, SCHEDULE: 1, STATIC: 2 };
        const modeA = modeOrder[a.dataMode as keyof typeof modeOrder] ?? 3;
        const modeB = modeOrder[b.dataMode as keyof typeof modeOrder] ?? 3;
        return modeA - modeB;
      case 'departure':
      default:
        // Sort by departure time
        const depA = getDepartureTimeForSort(a);
        const depB = getDepartureTimeForSort(b);
        if (!depA || !depB) return 0;
        return depA.localeCompare(depB);
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 md:pt-32 pb-12 md:pb-20 relative">
      {/* Header Section */}
      {/* Background image (low opacity) */}
        <img
          src="/Autobus-de-luxe.jpg"
          alt="Bus background"
          className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
        />
        {/* Keep the existing gradient/color effect above the image */}
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto my-4 md:my-6">
            {/* <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
              Find Your Perfect Route and Bus
            </h1> */}
            <SearchForm
              initialFromText={searchParams.fromText || searchParams.fromName}
              initialToText={searchParams.toText || searchParams.toName}
              initialFromStopId={searchParams.fromStopId}
              initialToStopId={searchParams.toStopId}
              initialDate={searchParams.date}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto">
          {/* Mobile Filter */}
          <div className="lg:hidden mb-6">
            <FilterSidebar
              filters={filters}
              onFiltersChange={setFilters}
              isOpen={isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>

          {/* Desktop Layout */}
          <div className="lg:flex lg:gap-6">
            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
              <div className="sticky top-4">
                <FilterSidebar
                  filters={filters}
                  onFiltersChange={setFilters}
                  isOpen={false}
                  onToggle={() => {}}
                />
              </div>
            </div>

            {/* Results Section */}
            <div className="flex-1 w-full lg:min-w-0">
              {/* Results Header */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">Available Buses</h2>
                    {fromStopName || toStopName ? (
                      <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Showing buses {fromStopName && `from ${fromStopName}`}
                        {fromStopName && toStopName && " "}
                        {toStopName && `to ${toStopName}`}
                      </p>
                    ) : (
                      <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Please search for buses
                      </p>
                    )}
                  </div>
                  {!loading && (
                    <Badge variant="secondary" className="text-sm self-start sm:self-center">
                      {totalResults} {totalResults === 1 ? 'bus' : 'buses'} found
                    </Badge>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Searching buses...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <Card className="p-6 sm:p-8 text-center w-full">
                  <CardContent>
                    <div className="text-red-500">
                      <Bus className="h-8 sm:h-12 w-8 sm:w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-base sm:text-lg font-semibold mb-2">Error</h3>
                      <p className="text-sm sm:text-base">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bus Cards */}
              {!loading && !error && (
                <div className="space-y-4">
                  {sortedBuses.length > 0 ? (
                    sortedBuses.map((bus, index) => (
                      <BusCard
                        key={bus.tripId || bus.scheduleId || `${bus.routeId}-${index}`}
                        bus={bus}
                        fromStopName={fromStopName}
                        toStopName={toStopName}
                        searchDate={searchParams.date}
                      />
                    ))
                  ) : !loading && (searchParams.fromStopId && searchParams.toStopId) ? (
                    <Card className="p-6 sm:p-8 text-center w-full">
                      <CardContent>
                        <div className="text-muted-foreground">
                          <Bus className="h-8 sm:h-12 w-8 sm:w-12 mx-auto mb-4 opacity-50" />
                          <h3 className="text-base sm:text-lg font-semibold mb-2">No buses with timing found</h3>
                          <p className="text-sm sm:text-base">No scheduled or real-time buses available for this route. Try adjusting your search date, time, or filters.</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : !loading && (
                    <Card className="p-6 sm:p-8 text-center w-full">
                      <CardContent>
                        <div className="text-muted-foreground">
                          <Bus className="h-8 sm:h-12 w-8 sm:w-12 mx-auto mb-4 opacity-50" />
                          <h3 className="text-base sm:text-lg font-semibold mb-2">Search for buses</h3>
                          <p className="text-sm sm:text-base">Please use the search form above to find available buses.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindMyBusPage;