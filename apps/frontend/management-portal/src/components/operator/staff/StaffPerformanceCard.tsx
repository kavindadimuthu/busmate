'use client';

import { BarChart3, Star, ThumbsUp, ThumbsDown, CheckCircle, Calendar } from 'lucide-react';
import type { PerformanceMetrics } from '@/data/operator/staff';

interface StaffPerformanceCardProps {
  performance: PerformanceMetrics;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
        />
      ))}
      <span className="ml-1.5 text-sm font-semibold text-gray-800">{rating.toFixed(1)}</span>
    </div>
  );
}

function MetricBlock({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`${color} rounded-xl p-4`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        {icon}
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export function StaffPerformanceCard({ performance }: StaffPerformanceCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <BarChart3 className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-gray-900">Performance Metrics</h2>
        <span className="text-xs text-gray-400 ml-auto">
          Last evaluated:{' '}
          {new Date(performance.lastEvaluationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
        </span>
      </div>

      <div className="p-5">
        {/* Rating row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-gray-500 mb-1">Passenger Rating</p>
            <RatingStars rating={performance.averageRating} />
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Trips Completed</p>
            <p className="text-2xl font-bold text-gray-900">{performance.totalTripsCompleted.toLocaleString()}</p>
          </div>
        </div>

        {/* On-time bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>On-Time Performance</span>
            <span className="font-semibold text-gray-800">{performance.onTimePercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                performance.onTimePercentage >= 90
                  ? 'bg-green-500'
                  : performance.onTimePercentage >= 75
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${performance.onTimePercentage}%` }}
            />
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricBlock
            icon={<ThumbsUp className="w-4 h-4 text-green-500" />}
            label="Commendations"
            value={String(performance.commendationsCount)}
            sub="Positive feedback received"
            color="bg-green-50"
          />
          <MetricBlock
            icon={<ThumbsDown className="w-4 h-4 text-red-400" />}
            label="Complaints"
            value={String(performance.complaintsCount)}
            sub="Complaints recorded"
            color="bg-red-50"
          />
        </div>
      </div>
    </div>
  );
}
