import { useContext } from 'react';
import { ScheduleWorkspaceContext } from './ScheduleWorkspaceContext';

export function useScheduleWorkspace() {
  const context = useContext(ScheduleWorkspaceContext);

  if (!context) {
    throw new Error('useScheduleWorkspace must be used within a ScheduleWorkspaceProvider');
  }

  return context;
}
