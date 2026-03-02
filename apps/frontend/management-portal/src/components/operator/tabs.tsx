"use client"

import type React from "react"

import { useState } from "react"

interface Tab {
  value: string
  label: string
  content: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultValue: string
  onValueChange?: (value: string) => void
}

export function Tabs({ tabs, defaultValue, onValueChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    onValueChange?.(value)
  }

  return (
    <div className="mb-6">
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 max-w-md">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              activeTab === tab.value ? "bg-white text-gray-900 shadow-sm" : "hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6">{tabs.find((tab) => tab.value === activeTab)?.content}</div>
    </div>
  )
}
