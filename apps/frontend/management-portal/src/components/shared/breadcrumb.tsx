"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { Fragment } from "react"

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  showHome?: boolean
  className?: string
}

export function Breadcrumb({ items, showHome = true, className = "" }: BreadcrumbProps) {
  // Filter out empty items
  const validItems = items.filter(item => item.label)

  // If no items, don't render anything
  if (validItems.length === 0 && !showHome) {
    return null
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`bg-white border-b border-gray-200 ${className}`}
    >
      <div className="px-6 py-2">
        <ol className="flex items-center space-x-0 text-sm">
          {/* Home item */}
          {showHome && (
            <li className="flex items-center">
              <Link
                href="/"
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200 group"
                aria-label="Home"
              >
                <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              </Link>
              {validItems.length > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1 shrink-0" />
              )}
            </li>
          )}

          {/* Breadcrumb items */}
          {validItems.map((item, index) => {
            const isLast = index === validItems.length - 1

            return (
              <Fragment key={index}>
                <li className="flex items-center">
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium hover:underline max-w-xs truncate"
                      aria-current={isLast ? "page" : undefined}
                    >
                      {item.icon && (
                        <span className="mr-1.5 shrink-0">{item.icon}</span>
                      )}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ) : (
                    <span
                      className={`flex items-center max-w-xs truncate ${
                        isLast
                          ? "text-gray-900 font-semibold"
                          : "text-gray-600"
                      }`}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {item.icon && (
                        <span className="mr-1.5 shrink-0">{item.icon}</span>
                      )}
                      <span className="truncate">{item.label}</span>
                    </span>
                  )}
                </li>

                {/* Separator */}
                {!isLast && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-2 shrink-0" />
                )}
              </Fragment>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
