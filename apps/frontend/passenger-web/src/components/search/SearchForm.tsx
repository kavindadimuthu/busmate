import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ArrowRight, Loader2, ArrowRightLeftIcon, Calendar, Calendar1, CalendarDays } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { PassengerApIsService } from "@/generated/api-client/route-management";
import type { PassengerStopResponse } from "@/generated/api-client/route-management";

interface SearchFormProps {
  // Optional initial values (used when navigating to the search page via URL or location.state)
  initialFromText?: string;
  initialToText?: string;
  initialFromStopId?: string;
  initialToStopId?: string;
  initialDate?: string;
}

interface StopOption {
  id: string;
  name: string;
  city: string;
}

const SearchForm = ({
  initialFromText,
  initialToText,
  initialFromStopId,
  initialToStopId,
  initialDate,
}: SearchFormProps) => {
  const today = new Date().toISOString().split('T')[0];
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL params first, then fall back to initial props
  const getInitialValue = (urlKey: string, propValue?: string, defaultValue = "") => {
    return searchParams.get(urlKey) || propValue || defaultValue;
  };

  const [fromText, setFromText] = useState(() => 
    getInitialValue("fromName", initialFromText) || getInitialValue("fromText", initialFromText)
  );
  const [toText, setToText] = useState(() => 
    getInitialValue("toName", initialToText) || getInitialValue("toText", initialToText)
  );
  const [fromStopId, setFromStopId] = useState(() => 
    getInitialValue("fromStopId", initialFromStopId)
  );
  const [toStopId, setToStopId] = useState(() => 
    getInitialValue("toStopId", initialToStopId)
  );
  const [travelDate, setTravelDate] = useState(() => 
    getInitialValue("date", initialDate, today)
  );
  
  const [fromStops, setFromStops] = useState<StopOption[]>([]);
  const [toStops, setToStops] = useState<StopOption[]>([]);
  const [fromLoading, setFromLoading] = useState(false);
  const [toLoading, setToLoading] = useState(false);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [fromDebounceTimer, setFromDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [toDebounceTimer, setToDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  // Sync state with URL parameters when they change
  useEffect(() => {
    const urlFromStopId = searchParams.get("fromStopId");
    const urlToStopId = searchParams.get("toStopId");
    const urlFromName = searchParams.get("fromName");
    const urlToName = searchParams.get("toName");
    const urlFromText = searchParams.get("fromText");
    const urlToText = searchParams.get("toText");
    const urlDate = searchParams.get("date");

    // Update state if URL params differ from current state
    if (urlFromStopId && urlFromStopId !== fromStopId) {
      setFromStopId(urlFromStopId);
    }
    if (urlToStopId && urlToStopId !== toStopId) {
      setToStopId(urlToStopId);
    }
    if ((urlFromName || urlFromText) && (urlFromName !== fromText && urlFromText !== fromText)) {
      setFromText(urlFromName || urlFromText || "");
    }
    if ((urlToName || urlToText) && (urlToName !== toText && urlToText !== toText)) {
      setToText(urlToName || urlToText || "");
    }
    if (urlDate && urlDate !== travelDate) {
      setTravelDate(urlDate);
    }
  }, [searchParams]);

  // Update URL when form state changes (if on FindMyBusPage)
  useEffect(() => {
    // Only sync to URL if we're on the /findmybus page
    if (location.pathname === '/findmybus' && (fromStopId || toStopId || fromText || toText)) {
      const newParams = new URLSearchParams();
      
      if (fromStopId) newParams.set("fromStopId", fromStopId);
      if (toStopId) newParams.set("toStopId", toStopId);
      if (fromText) {
        if (fromStopId) {
          newParams.set("fromName", fromText);
        } else {
          newParams.set("fromText", fromText);
        }
      }
      if (toText) {
        if (toStopId) {
          newParams.set("toName", toText);
        } else {
          newParams.set("toText", toText);
        }
      }
      if (travelDate) newParams.set("date", travelDate);

      // Only update if params actually changed
      const currentParams = searchParams.toString();
      const newParamsString = newParams.toString();
      if (currentParams !== newParamsString && newParamsString) {
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [fromStopId, toStopId, fromText, toText, travelDate, location.pathname]);

  // Search stops function
  const searchStops = async (query: string, type: 'from' | 'to') => {
    if (query.length < 2) {
      if (type === 'from') {
        setFromStops([]);
        setShowFromDropdown(false);
      } else {
        setToStops([]);
        setShowToDropdown(false);
      }
      return;
    }

    try {
      if (type === 'from') {
        setFromLoading(true);
      } else {
        setToLoading(true);
      }

      const response = await PassengerApIsService.searchStops(
        undefined, // name
        undefined, // city
        query, // searchText
        undefined, // accessibleOnly
        0, // page
        10 // size
      );

      const stops = response.content?.map(stop => ({
        id: stop.stopId || '',
        name: stop.name || '',
        city: stop.city || ''
      })) || [];

      if (type === 'from') {
        setFromStops(stops);
        setShowFromDropdown(true);
      } else {
        setToStops(stops);
        setShowToDropdown(true);
      }
    } catch (error) {
      console.error('Error searching stops:', error);
    } finally {
      if (type === 'from') {
        setFromLoading(false);
      } else {
        setToLoading(false);
      }
    }
  };

  // Debounced search
  const handleFromTextChange = (value: string) => {
    setFromText(value);
    setFromStopId(''); // Clear selected stop when typing
    
    if (fromDebounceTimer) {
      clearTimeout(fromDebounceTimer);
    }
    
    const timer = setTimeout(() => {
      searchStops(value, 'from');
    }, 300);
    
    setFromDebounceTimer(timer);
  };

  const handleToTextChange = (value: string) => {
    setToText(value);
    setToStopId(''); // Clear selected stop when typing
    
    if (toDebounceTimer) {
      clearTimeout(toDebounceTimer);
    }
    
    const timer = setTimeout(() => {
      searchStops(value, 'to');
    }, 300);
    
    setToDebounceTimer(timer);
  };

  // Select stop
  const selectFromStop = (stop: StopOption) => {
    setFromText(stop.name);
    setFromStopId(stop.id);
    setShowFromDropdown(false);
  };

  const selectToStop = (stop: StopOption) => {
    setToText(stop.name);
    setToStopId(stop.id);
    setShowToDropdown(false);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target as Node)) {
        setShowFromDropdown(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(event.target as Node)) {
        setShowToDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (fromDebounceTimer) clearTimeout(fromDebounceTimer);
      if (toDebounceTimer) clearTimeout(toDebounceTimer);
    };
  }, [fromDebounceTimer, toDebounceTimer]);

  // Swap from and to locations
  const handleSwapLocations = () => {
    // Swap text values
    const tempFromText = fromText;
    const tempToText = toText;
    setFromText(tempToText);
    setToText(tempFromText);

    // Swap stop IDs
    const tempFromStopId = fromStopId;
    const tempToStopId = toStopId;
    setFromStopId(tempToStopId);
    setToStopId(tempFromStopId);

    // Clear dropdowns
    setShowFromDropdown(false);
    setShowToDropdown(false);

    // Clear stops arrays to force re-search if needed
    setFromStops([]);
    setToStops([]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromStopId && toStopId) {
      navigate(`/findmybus?fromStopId=${encodeURIComponent(fromStopId)}&toStopId=${encodeURIComponent(toStopId)}&fromName=${encodeURIComponent(fromText)}&toName=${encodeURIComponent(toText)}&date=${travelDate}`);
    } else if (fromText.trim() || toText.trim()) {
      // Fallback for partial text search
      navigate(`/findmybus?fromText=${encodeURIComponent(fromText)}&toText=${encodeURIComponent(toText)}&date=${travelDate}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      {/* Mobile Layout - Card Style */}
      <div className="md:hidden bg-white/95 backdrop-blur-sm rounded-3xl shadow-elegant border-2 border-white/20 overflow-hidden">
        {/* From Field */}
        <div className="relative border-b-2 border-gray-300/50" ref={fromDropdownRef}>
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
            <MapPin className="text-muted-foreground h-5 w-5" />
          </div>
          {fromLoading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            </div>
          )}
          <Input
            type="text"
            placeholder="From"
            value={fromText}
            onChange={(e) => handleFromTextChange(e.target.value)}
            onFocus={() => fromText.length >= 2 && fromStops.length > 0 && setShowFromDropdown(true)}
            onClick={(e) => {
              e.currentTarget.focus();
              if (fromText.length >= 2 && fromStops.length > 0) {
                setShowFromDropdown(true);
              }
            }}
            className={`pl-12 ${fromLoading ? 'pr-12' : 'pr-4'} h-16 text-base border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-text`}
          />
          
          {/* From Stops Dropdown */}
          {showFromDropdown && fromStops.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] max-h-60 overflow-y-auto">
              {fromStops.map((stop) => (
                <button
                  key={stop.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectFromStop(stop);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    selectFromStop(stop);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{stop.name}</div>
                  {stop.city && <div className="text-sm text-gray-500">{stop.city}</div>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -mt-8 -mb-8 -mr-60 relative z-20">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleSwapLocations}
            className="bg-gray-500 border-2 border-gray-200 hover:border-primary/50 transition-all duration-300 rounded-full w-16 h-16 p-2 shadow-md hover:shadow-lg"
          >
            <ArrowRightLeftIcon className="h-12 w-12 text-white rotate-90" />
          </Button>
        </div>

        {/* To Field */}
        <div className="relative border-b-2 border-gray-300/50" ref={toDropdownRef}>
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
            <MapPin className="text-muted-foreground h-5 w-5" />
          </div>
          {toLoading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            </div>
          )}
          <Input
            type="text"
            placeholder="To"
            value={toText}
            onChange={(e) => handleToTextChange(e.target.value)}
            onFocus={() => toText.length >= 2 && toStops.length > 0 && setShowToDropdown(true)}
            onClick={(e) => {
              e.currentTarget.focus();
              if (toText.length >= 2 && toStops.length > 0) {
                setShowToDropdown(true);
              }
            }}
            className={`pl-12 ${toLoading ? 'pr-12' : 'pr-4'} h-16 text-base border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-text`}
          />
          
          {/* To Stops Dropdown */}
          {showToDropdown && toStops.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] max-h-60 overflow-y-auto">
              {toStops.map((stop) => (
                <button
                  key={stop.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectToStop(stop);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    selectToStop(stop);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{stop.name}</div>
                  {stop.city && <div className="text-sm text-gray-500">{stop.city}</div>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Field */}
        <div className="relative px-4 pt-2">
          <div className="text-xs text-muted-foreground font-medium">Date of Journey</div>
          <div className="flex gap-2 items-center">
            <CalendarDays className="flex items-start -mr-1 text-muted-foreground h-5 w-5 z-10" />
            <Input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="flex-1 h-12 text-base border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTravelDate(today)}
                className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                  travelDate === today 
                    ? 'bg-primary/10 text-primary border-primary/30' 
                    : 'bg-white border-gray-200'
                }`}
              >
                Today
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setTravelDate(tomorrow.toISOString().split('T')[0]);
                }}
                className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                  travelDate === new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-white border-gray-200'
                }`}
              >
                Tomorrow
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Button */}
      <Button
        type="submit"
        size="lg"
        className="md:hidden w-full h-14 text-lg rounded-full bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 shadow-elegant font-semibold"
      >
        <Search className="mr-2 h-5 w-5" />
        Find My Bus
      </Button>

      {/* Desktop Layout - Original Design */}
      <div className="hidden md:flex gap-4">
        <div className="flex-1 relative" ref={fromDropdownRef}>
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
          {fromLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin z-10" />
          )}
          <Input
            type="text"
            placeholder="From"
            value={fromText}
            onChange={(e) => handleFromTextChange(e.target.value)}
            onFocus={() => fromText.length >= 2 && fromStops.length > 0 && setShowFromDropdown(true)}
            className={`pl-10 ${fromLoading ? 'pr-10' : ''} h-14 text-lg rounded-2xl bg-white/95 backdrop-blur-sm shadow-elegant border-2 border-white/20 focus:border-primary/50 transition-all duration-300`}
          />
          
          {/* From Stops Dropdown */}
          {showFromDropdown && fromStops.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {fromStops.map((stop) => (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => selectFromStop(stop)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{stop.name}</div>
                  {stop.city && <div className="text-sm text-gray-500">{stop.city}</div>}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSwapLocations}
          className="bg-white/95 backdrop-blur-sm shadow-elegant border-2 border-white/20 hover:border-primary/50 transition-all duration-300 rounded-full p-3 h-auto w-auto self-center"
        >
          <ArrowRightLeftIcon className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        </Button>

        <div className="flex-1 relative" ref={toDropdownRef}>
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
          {toLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin z-10" />
          )}
          <Input
            type="text"
            placeholder="To"
            value={toText}
            onChange={(e) => handleToTextChange(e.target.value)}
            onFocus={() => toText.length >= 2 && toStops.length > 0 && setShowToDropdown(true)}
            className={`pl-10 ${toLoading ? 'pr-10' : ''} h-14 text-lg rounded-2xl bg-white/95 backdrop-blur-sm shadow-elegant border-2 border-white/20 focus:border-primary/50 transition-all duration-300`}
          />
          
          {/* To Stops Dropdown */}
          {showToDropdown && toStops.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {toStops.map((stop) => (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => selectToStop(stop)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{stop.name}</div>
                  {stop.city && <div className="text-sm text-gray-500">{stop.city}</div>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          <Input
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            className="h-14 text-lg rounded-2xl bg-white/95 backdrop-blur-sm shadow-elegant border-2 border-white/20 focus:border-primary/50 transition-all duration-300"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-14 px-10 text-lg rounded-2xl bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 shadow-elegant font-semibold"
        >
          <Search className="mr-2 h-5 w-5" />
          Find My Bus
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;