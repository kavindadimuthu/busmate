import { useContext } from 'react';
import { RouteWorkspaceContext } from './RouteWorkspaceContext';

export function useRouteWorkspace() {
  const context = useContext(RouteWorkspaceContext);
  
  if (!context) {
    throw new Error('useRouteWorkspace must be used within a RouteWorkspaceProvider');
  }
  
  return context;
}
