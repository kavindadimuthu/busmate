import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  Bus, 
  X,
  SlidersHorizontal,
  Calendar
} from "lucide-react";

interface FilterState {
  departureTimeFrom: string;
  routeNumber: string;
  roadType: 'NORMALWAY' | 'EXPRESSWAY' | '';
  sortBy: string;
}

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const roadTypes = [
  { id: "", label: "All Road Types" },
  { id: "NORMALWAY", label: "Normal Way" },
  { id: "EXPRESSWAY", label: "Expressway" }
];

const sortOptions = [
  { id: "departure", label: "Departure Time" },
  { id: "duration", label: "Duration" },
  { id: "distance", label: "Distance" },
  { id: "dataMode", label: "Data Availability" }
];

const FilterSidebar = ({ filters, onFiltersChange, isOpen, onToggle }: FilterSidebarProps) => {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      departureTimeFrom: '',
      routeNumber: '',
      roadType: '',
      sortBy: 'departure'
    });
  };

  const activeFiltersCount = 
    (filters.departureTimeFrom ? 1 : 0) + 
    (filters.routeNumber ? 1 : 0) + 
    (filters.roadType ? 1 : 0);

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={onToggle}
          className="w-full justify-start gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter Sidebar */}
      <div className={`
        fixed lg:relative top-0 left-0 h-full lg:h-auto
        w-80 lg:w-full bg-background lg:bg-transparent
        border-r lg:border-r-0 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto
      `}>
        <Card className="h-full lg:h-auto border-0 lg:border rounded-none lg:rounded-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="lg:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Accordion type="multiple" defaultValue={["travel-date", "time"]} className="w-full">
              
              {/* Sort By */}
              <AccordionItem value="sort">
                <AccordionTrigger className="text-sm font-medium">
                  Sort By
                </AccordionTrigger>
                <AccordionContent>
                  <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select sort option" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </AccordionContent>
              </AccordionItem>

              {/* Road Type */}
              <AccordionItem value="road-type">
                <AccordionTrigger className="text-sm font-medium">
                  Road Type
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {roadTypes.map((road) => (
                      <div key={road.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`road-${road.id}`}
                          checked={filters.roadType === road.id}
                          onCheckedChange={() => updateFilter('roadType', road.id)}
                        />
                        <label
                          htmlFor={`road-${road.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {road.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Route Number */}
              <AccordionItem value="route-number">
                <AccordionTrigger className="text-sm font-medium">
                  Route Number
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <Label htmlFor="route-number" className="text-sm">Filter by Route Number</Label>
                    <Input
                      id="route-number"
                      type="text"
                      value={filters.routeNumber}
                      onChange={(e) => updateFilter('routeNumber', e.target.value)}
                      placeholder="e.g., 101, 138"
                      className="w-full"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Departure Time */}
              <AccordionItem value="time">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Departure Time From
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <Label htmlFor="time-from" className="text-sm">Earliest Departure</Label>
                    <Input
                      id="time-from"
                      type="time"
                      value={filters.departureTimeFrom}
                      onChange={(e) => updateFilter('departureTimeFrom', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default FilterSidebar;