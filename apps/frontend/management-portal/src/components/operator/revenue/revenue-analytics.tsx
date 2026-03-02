"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Download, Calendar, Bus, TrendingUp, DollarSign, Users, RefreshCw } from "lucide-react"
import { MetricCard } from "@/components/operator/metric-card"
import { RevenueChart } from "./revenue-chart"
import { RevenueService, type BusRevenueData } from "@/lib/services/revenueService"
import { sampleAuthState } from "@/_temp_/sampleAuth"

interface RevenueData {
  id: string
  busNumber: string
  busName: string
  route: string
  driver: string
  conductor: string
  date: string
  totalTrips: number
  ticketsIssued: number
  revenue: number
  averageTicketPrice: number
}

// Mock operator ID - in production, get this from auth context
const MOCK_OPERATOR_ID = "a3d63f60-91b7-4a18-9a42-5b44e80f8d9e";

export function RevenueAnalytics() {
  const { user } = sampleAuthState;
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBus, setSelectedBus] = useState("all")
  const [dateRange, setDateRange] = useState("today")
  const [viewType, setViewType] = useState("bus") // bus, day, trip
  const [loading, setLoading] = useState(true)
  const [busRevenueData, setBusRevenueData] = useState<BusRevenueData[]>([])
  const [paymentStatusData, setPaymentStatusData] = useState({ paid: 0, pending: 0, failed: 0 })

  // Fetch revenue data from backend
  useEffect(() => {
    loadRevenueData()
  }, [user])

  const loadRevenueData = async () => {
    try {
      setLoading(true)
      // Use mock operator ID for now since user object doesn't have operatorId
      const operatorId = MOCK_OPERATOR_ID

      // Fetch bus revenue data
      const busRevenue = await RevenueService.getOperatorBusRevenue(operatorId)
      setBusRevenueData(busRevenue)

      // Fetch payment status data
      const paymentData = await RevenueService.getRevenueByPaymentStatus(operatorId)
      setPaymentStatusData(paymentData)
    } catch (error) {
      console.error('Error loading revenue data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Convert backend data to display format
  const revenueData: RevenueData[] = busRevenueData.map((bus) => ({
    id: bus.busId,
    busNumber: bus.busNumber,
    busName: bus.busName || 'N/A',
    route: bus.route || 'N/A',
    driver: 'N/A', // Not available from ticketing API
    conductor: 'N/A', // Not available from ticketing API
    date: new Date().toISOString().split('T')[0],
    totalTrips: bus.totalTrips,
    ticketsIssued: bus.ticketsIssued,
    revenue: bus.revenue,
    averageTicketPrice: bus.averageTicketPrice
  }))

  // Sample revenue data (fallback for testing)
  const sampleRevenueData: RevenueData[] = [
    {
      id: "1",
      busNumber: "ND 4536",
      busName: "Mandakini Express",
      route: "MATARA-GALLE",
      driver: "Kasun Perera",
      conductor: "Nuwan Silva",
      date: "2025-01-22",
      totalTrips: 8,
      ticketsIssued: 234,
      revenue: 28560.00,
      averageTicketPrice: 122.00
    },
    {
      id: "2",
      busNumber: "ND 7892",
      busName: "Mandakini Super",
      route: "MATARA-COLOMBO",
      driver: "Chaminda Fernando",
      conductor: "Roshan Jayawardena",
      date: "2025-01-22",
      totalTrips: 6,
      ticketsIssued: 187,
      revenue: 45320.00,
      averageTicketPrice: 242.00
    },
    {
      id: "3",
      busNumber: "ND 3421",
      busName: "Mandakini Classic",
      route: "MATARA-TANGALLE",
      driver: "Pradeep Kumara",
      conductor: "Mahinda Rathnayake",
      date: "2025-01-22",
      totalTrips: 10,
      ticketsIssued: 156,
      revenue: 18720.00,
      averageTicketPrice: 120.00
    },
    {
      id: "4",
      busNumber: "ND 8765",
      busName: "Mandakini Deluxe",
      route: "MATARA-HAMBANTOTA",
      driver: "Dinesh Bandara",
      conductor: "Sampath Wijesinghe",
      date: "2025-01-22",
      totalTrips: 7,
      ticketsIssued: 142,
      revenue: 21300.00,
      averageTicketPrice: 150.00
    },
    {
      id: "5",
      busNumber: "ND 9876",
      busName: "Mandakini Royal",
      route: "MATARA-WELIGAMA",
      driver: "Sunil Rajapaksha",
      conductor: "Chandana Senanayake",
      date: "2025-01-22",
      totalTrips: 12,
      ticketsIssued: 198,
      revenue: 15840.00,
      averageTicketPrice: 80.00
    }
  ]

  // Use real data if available, fallback to sample data
  const displayData = busRevenueData.length > 0 ? revenueData : sampleRevenueData

  const filteredData = displayData.filter(item => {
    const matchesSearch = item.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.busName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.route.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBus = selectedBus === "all" || item.busNumber === selectedBus
    return matchesSearch && matchesBus
  })

  const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0)
  const totalTickets = filteredData.reduce((sum, item) => sum + item.ticketsIssued, 0)
  const totalTrips = filteredData.reduce((sum, item) => sum + item.totalTrips, 0)
  const averageRevenue = filteredData.length > 0 ? totalRevenue / filteredData.length : 0

  const uniqueBuses = Array.from(new Set(displayData.map(item => item.busNumber)))

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-800">Loading revenue data...</span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`Rs ${totalRevenue.toLocaleString()}.00`}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          trend={{
            value: "+12.5%",
            type: "positive",
            label: "vs yesterday"
          }}
          borderColor="border-l-green-500"
        />
        <MetricCard
          title="Tickets Issued"
          value={totalTickets.toLocaleString()}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          trend={{
            value: "+8.3%",
            type: "positive",
            label: "vs yesterday"
          }}
          borderColor="border-l-blue-500"
        />
        <MetricCard
          title="Total Trips"
          value={totalTrips}
          icon={<Bus className="w-6 h-6 text-purple-600" />}
          trend={{
            value: "+5.2%",
            type: "positive",
            label: "vs yesterday"
          }}
          borderColor="border-l-purple-500"
        />
        <MetricCard
          title="Avg Revenue/Bus"
          value={`Rs ${averageRevenue.toFixed(0)}`}
          icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
          trend={{
            value: "+3.1%",
            type: "positive",
            label: "vs yesterday"
          }}
          borderColor="border-l-orange-500"
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
                placeholder="Search by bus number, name, or route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={selectedBus}
              onChange={(e) => setSelectedBus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Buses</option>
              {uniqueBuses.map(bus => (
                <option key={bus} value={bus}>{bus}</option>
              ))}
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thismonth">This Month</option>
            </select>

            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="bus">Bus Wise</option>
              <option value="day">Day Wise</option>
              <option value="trip">Trip Wise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart
          title="Revenue by Bus"
          data={filteredData.map(item => ({
            label: item.busNumber,
            value: item.revenue,
            color: "#3B82F6"
          }))}
        />
        <RevenueChart
          title="Revenue by Payment Status"
          data={[
            {
              label: "Paid",
              value: paymentStatusData.paid,
              color: "#10B981" // green
            },
            {
              label: "Pending",
              value: paymentStatusData.pending,
              color: "#F59E0B" // orange
            },
            {
              label: "Failed",
              value: paymentStatusData.failed,
              color: "#EF4444" // red
            }
          ].filter(item => item.value > 0)}
        />
      </div>

      {/* Revenue Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Details - {viewType.charAt(0).toUpperCase() + viewType.slice(1)} View</h3>
          <span className="text-sm text-gray-500">Showing {filteredData.length} {filteredData.length === 1 ? 'result' : 'results'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trips</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.busNumber}</div>
                      <div className="text-sm text-gray-500">{item.busName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.route}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Driver: {item.driver}</div>
                    <div className="text-sm text-gray-500">Conductor: {item.conductor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.totalTrips}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.ticketsIssued}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Rs {item.averageTicketPrice.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">Rs {item.revenue.toLocaleString()}.00</div>
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
