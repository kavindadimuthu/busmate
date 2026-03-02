import { createContext } from 'react';
import {
  ScheduleWorkspaceData,
  createEmptyScheduleWorkspaceData,
  createEmptySchedule,
  Schedule,
  ScheduleStop,
  ScheduleCalendar,
  ScheduleException,
  RouteReference,
  RouteStopReference,
} from '@/types/ScheduleWorkspaceData';

// Workspace mode: 'create' for new schedules, 'edit' for existing ones
export type ScheduleWorkspaceMode = 'create' | 'edit';

export interface ScheduleWorkspaceContextType {
  // Mode and loading state
  mode: ScheduleWorkspaceMode;
  isLoading: boolean;
  loadError: string | null;

  // Load existing schedules for a route for editing
  loadSchedulesForRoute: (routeId: string) => Promise<boolean>;
  // Reset to create mode
  resetToCreateMode: () => Promise<void>;

  // Data
  data: ScheduleWorkspaceData;

  // YAML serialization (for textual mode)
  getYaml: () => string;
  updateFromYaml: (yamlText: string) => string | null; // Returns error message or null on success

  // JSON serialization (for textual mode)
  getJson: () => string;
  updateFromJson: (jsonText: string) => string | null; // Returns error message or null on success

  // Route selection (async - loads from API)
  setSelectedRoute: (routeId: string) => Promise<void>;
  loadAvailableRoutes: () => Promise<void>;

  // Multi-schedule management
  activeScheduleIndex: number | null;
  setActiveScheduleIndex: (index: number | null) => void;
  highlightedScheduleIndex: number | null;
  setHighlightedScheduleIndex: (index: number | null) => void;
  addNewSchedule: () => void;
  removeSchedule: (scheduleIndex: number) => void;
  duplicateSchedule: (scheduleIndex: number) => void;

  // Active schedule metadata operations (operates on activeScheduleIndex)
  updateActiveSchedule: (schedule: Partial<Schedule>) => void;
  getActiveSchedule: () => Schedule | null;

  // Schedule stops operations for active schedule
  updateScheduleStop: (stopIndex: number, scheduleStop: Partial<ScheduleStop>) => void;
  setAllStopTimes: (baseTime: string, intervalMinutes: number) => void;
  clearAllStopTimes: () => void;

  // Schedule stops operations for specific schedule (used by grid)
  updateScheduleStopByScheduleIndex: (
    scheduleIndex: number, 
    stopIndex: number, 
    scheduleStop: Partial<ScheduleStop>
  ) => void;

  // Calendar operations for active schedule
  updateCalendar: (calendar: Partial<ScheduleCalendar>) => void;
  setAllDays: (enabled: boolean) => void;
  setWeekdaysOnly: () => void;
  setWeekendsOnly: () => void;

  // Exception operations for active schedule
  addException: (exception: ScheduleException) => void;
  updateException: (exceptionIndex: number, exception: Partial<ScheduleException>) => void;
  removeException: (exceptionIndex: number) => void;

  // Selection state
  selectedStopIndex: number | null;
  setSelectedStopIndex: (index: number | null) => void;
  selectedExceptionIndex: number | null;
  setSelectedExceptionIndex: (index: number | null) => void;

  // Submission
  getAllSchedules: () => Schedule[];
  validateAllSchedules: () => { valid: boolean; invalidCount: number; scheduleErrors: { index: number; name: string; errors: string[] }[] };
  submitAllSchedules: () => Promise<void>;
}

export const ScheduleWorkspaceContext = createContext<ScheduleWorkspaceContextType>({
  // Mode and loading state defaults
  mode: 'create',
  isLoading: false,
  loadError: null,

  // Load/reset defaults
  loadSchedulesForRoute: async () => false,
  resetToCreateMode: async () => {},

  // Data defaults
  data: createEmptyScheduleWorkspaceData(),

  // YAML serialization defaults
  getYaml: () => '',
  updateFromYaml: () => null,

  // JSON serialization defaults
  getJson: () => '',
  updateFromJson: () => null,

  // Route selection defaults (async)
  setSelectedRoute: async () => {},
  loadAvailableRoutes: async () => {},

  // Multi-schedule management defaults
  activeScheduleIndex: null,
  setActiveScheduleIndex: () => {},
  highlightedScheduleIndex: null,
  setHighlightedScheduleIndex: () => {},
  addNewSchedule: () => {},
  removeSchedule: () => {},
  duplicateSchedule: () => {},

  // Active schedule operations defaults
  updateActiveSchedule: () => {},
  getActiveSchedule: () => null,

  // Schedule stops defaults
  updateScheduleStop: () => {},
  setAllStopTimes: () => {},
  clearAllStopTimes: () => {},
  updateScheduleStopByScheduleIndex: () => {},

  // Calendar defaults
  updateCalendar: () => {},
  setAllDays: () => {},
  setWeekdaysOnly: () => {},
  setWeekendsOnly: () => {},

  // Exception defaults
  addException: () => {},
  updateException: () => {},
  removeException: () => {},

  // Selection defaults
  selectedStopIndex: null,
  setSelectedStopIndex: () => {},
  selectedExceptionIndex: null,
  setSelectedExceptionIndex: () => {},

  // Submission defaults
  getAllSchedules: () => [],
  validateAllSchedules: () => ({ valid: false, invalidCount: 0, scheduleErrors: [] }),
  submitAllSchedules: async () => {},
});
