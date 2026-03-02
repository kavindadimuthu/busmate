"use client"

import { useState } from "react"
import { Search, Filter, Download, Calendar, Users, DollarSign, TrendingUp, Clock } from "lucide-react"
import { MetricCard } from "@/components/operator/metric-card"

interface SalaryData {
  id: string
  staffId: string
  name: string
  role: "Driver" | "Conductor"
  busAssigned: string
  route: string
  baseSalary: number
  bonuses: number
  deductions: number
  totalSalary: number
  paymentStatus: "Paid" | "Pending" | "Processing"
  paymentDate: string
  workDate: string
  month: string
}

export function SalaryManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedDate, setSelectedDate] = useState("2025-01-22")
  const [selectedMonth, setSelectedMonth] = useState("2025-01")
  const [paymentStatus, setPaymentStatus] = useState("all")

  // Sample salary data - Daily payments in Sri Lanka
  const salaryData: SalaryData[] = [
    {
      id: "1",
      staffId: "EMP001",
      name: "Kasun Perera",
      role: "Driver",
      busAssigned: "ND 4536",
      route: "MATARA-GALLE",
      baseSalary: 1500,
      bonuses: 200,
      deductions: 50,
      totalSalary: 1650,
      paymentStatus: "Paid",
      paymentDate: "2025-01-22",
      workDate: "2025-01-22",
      month: "2025-01"
    },
    {
      id: "2",
      staffId: "EMP002",
      name: "Nuwan Silva",
      role: "Conductor",
      busAssigned: "ND 4536",
      route: "MATARA-GALLE",
      baseSalary: 1200,
      bonuses: 150,
      deductions: 30,
      totalSalary: 1320,
      paymentStatus: "Paid",
      paymentDate: "2025-01-22",
      workDate: "2025-01-22",
      month: "2025-01"
    },
    {
      id: "3",
      staffId: "EMP003",
      name: "Chaminda Fernando",
      role: "Driver",
      busAssigned: "ND 7892",
      route: "MATARA-COLOMBO",
      baseSalary: 1800,
      bonuses: 300,
      deductions: 80,
      totalSalary: 2020,
      paymentStatus: "Processing",
      paymentDate: "2025-01-22",
      workDate: "2025-01-22",
      month: "2025-01"
    },
    {
      id: "4",
      staffId: "EMP004",
      name: "Roshan Jayawardena",
      role: "Conductor",
      busAssigned: "ND 7892",
      route: "MATARA-COLOMBO",
      baseSalary: 1400,
      bonuses: 200,
      deductions: 40,
      totalSalary: 1560,
      paymentStatus: "Pending",
      paymentDate: "2025-01-22",
      workDate: "2025-01-22",
      month: "2025-01"
    },
    {
      id: "5",
      staffId: "EMP005",
      name: "Pradeep Kumara",
      role: "Driver",
      busAssigned: "ND 3421",
      route: "MATARA-TANGALLE",
      baseSalary: 1600,
      bonuses: 180,
      deductions: 60,
      totalSalary: 1720,
      paymentStatus: "Paid",
      paymentDate: "2025-01-21",
      workDate: "2025-01-21",
      month: "2025-01"
    },
    {
      id: "6",
      staffId: "EMP006",
      name: "Mahinda Rathnayake",
      role: "Conductor",
      busAssigned: "ND 3421",
      route: "MATARA-TANGALLE",
      baseSalary: 1300,
      bonuses: 120,
      deductions: 20,
      totalSalary: 1400,
      paymentStatus: "Paid",
      paymentDate: "2025-01-21",
      workDate: "2025-01-21",
      month: "2025-01"
    }
  ]

  const filteredData = salaryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.busAssigned.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === "all" || item.role === selectedRole
    const matchesMonth = item.month === selectedMonth
    const matchesDate = item.workDate === selectedDate
    const matchesStatus = paymentStatus === "all" || item.paymentStatus === paymentStatus
    return matchesSearch && matchesRole && matchesMonth && matchesDate && matchesStatus
  })

  const totalSalaryPaid = filteredData
    .filter(item => item.paymentStatus === "Paid")
    .reduce((sum, item) => sum + item.totalSalary, 0)
  
  const totalPending = filteredData
    .filter(item => item.paymentStatus === "Pending")
    .reduce((sum, item) => sum + item.totalSalary, 0)

  const totalBonuses = filteredData.reduce((sum, item) => sum + item.bonuses, 0)
  const averageSalary = filteredData.length > 0 ? filteredData.reduce((sum, item) => sum + item.totalSalary, 0) / filteredData.length : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800"
      case "Processing":
        return "bg-yellow-100 text-yellow-800"
      case "Pending":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProfileIconColor = (role: "Driver" | "Conductor") => {
    return role === "Driver" 
      ? "bg-green-100 text-green-600" 
      : "bg-purple-100 text-purple-600"
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Paid"
          value={`Rs ${totalSalaryPaid.toLocaleString()}.00`}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          trend={{
            value: "+5.2%",
            type: "positive",
            label: "vs last month"
          }}
          borderColor="border-l-green-500"
        />
        <MetricCard
          title="Pending Payments"
          value={`Rs ${totalPending.toLocaleString()}.00`}
          icon={<Clock className="w-6 h-6 text-red-600" />}
          trend={{
            value: "-12.3%",
            type: "positive",
            label: "vs last month"
          }}
          borderColor="border-l-red-500"
        />
        <MetricCard
          title="Total Bonuses"
          value={`Rs ${totalBonuses.toLocaleString()}.00`}
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          trend={{
            value: "+8.1%",
            type: "positive",
            label: "vs last month"
          }}
          borderColor="border-l-blue-500"
        />
        <MetricCard
          title="Avg Salary"
          value={`Rs ${averageSalary.toFixed(0)}`}
          icon={<Users className="w-6 h-6 text-purple-600" />}
          trend={{
            value: "+3.5%",
            type: "positive",
            label: "vs last month"
          }}
          borderColor="border-l-purple-500"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, staff ID, or bus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="Driver">Drivers</option>
              <option value="Conductor">Conductors</option>
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Processing">Processing</option>
              <option value="Pending">Pending</option>
            </select>

            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Salary Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Daily Salary Details - {selectedDate}</h3>
          <span className="text-sm text-gray-500">Showing {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonuses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getProfileIconColor(item.role)}`}>
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.staffId} • {item.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.busAssigned}</div>
                    <div className="text-sm text-gray-500">{item.route}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.workDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Rs {item.baseSalary.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">Rs {item.bonuses.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-red-600">Rs {item.deductions.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">Rs {item.totalSalary.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.paymentStatus)}`}>
                      {item.paymentStatus}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{item.paymentDate}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
