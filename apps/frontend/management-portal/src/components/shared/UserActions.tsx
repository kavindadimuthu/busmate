'use client';

import { LogOut, CircleUser, Settings } from 'lucide-react';
import Link from 'next/link';
import UserData from '@/types/UserData';
import signOut from '@/lib/utils/signOut';

interface UserActionsProps {
  userData: UserData | null;
  role?: string;
  isCollapsed: boolean;
  userMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
}

/**
 * Client-side User Actions Component
 * 
 * Handles interactive user menu, profile navigation, and logout functionality.
 * This component is client-side only as it requires interactivity.
 */
export function UserActions({
  userData,
  role,
  isCollapsed,
  userMenuOpen,
  onToggleMenu,
  onCloseMenu,
}: UserActionsProps) {

  const displayEmail = userData?.email || 'Administrator';
  const displayRole = userData?.user_role || role || 'User';
  const displayName = userData?.firstName || displayEmail;

  // Normalise the role into the URL path segment (timeKeeper → timekeeper)
  const rolePath = (role || 'admin').toLowerCase();

  return (
    <>
      {/* Dropdown Menu (opens upward) */}
      {userMenuOpen && (
        <div
          className={`absolute bottom-full mb-2 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 min-w-[210px] ${
            isCollapsed
              ? '-left-2 ml-2 bottom-0 top-auto'
              : 'left-0 right-0'
          }`}
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {displayEmail}
            </p>
            <p className="text-xs text-gray-400 truncate mt-0.5 capitalize">
              {displayRole}
            </p>
          </div>

          {/* Menu items */}
          <Link
            href={`/${rolePath}/profile`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={onCloseMenu}
          >
            <CircleUser className="w-4 h-4 text-gray-400" />
            Profile
          </Link>
          <Link
            href={`/${rolePath}/settings`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={onCloseMenu}
          >
            <Settings className="w-4 h-4 text-gray-400" />
            Settings
          </Link>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}

      {/* User Button */}
      <button
        onClick={onToggleMenu}
        className={`flex items-center gap-2.5 text-blue-100 rounded-lg transition-all duration-200 ${
          isCollapsed
            ? 'justify-center p-2 w-full'
            : 'flex-1 px-3 py-2 w-full'
        } ${
          userMenuOpen
            ? 'bg-blue-700 text-white'
            : 'hover:bg-blue-700/60 hover:text-white'
        }`}
        title={isCollapsed ? displayEmail : undefined}
      >
        <div
          className={`${
            isCollapsed ? 'w-9 h-9' : 'w-8 h-8'
          } rounded-full bg-blue-600 flex items-center justify-center shrink-0 ring-2 ring-blue-400/40`}
        >
          <CircleUser className="w-4 h-4 text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">
              {displayName}
            </p>
            <p className="text-xs text-blue-300 truncate capitalize leading-tight mt-0.5">
              {displayRole}
            </p>
          </div>
        )}
      </button>
    </>
  );
}
