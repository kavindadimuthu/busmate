# BusMate Web Routes

This document lists all available web page routes in the BusMate project, derived from the Next.js app directory structure. Routes are organized by section for easier navigation and project cleaning.

## Root
- /

## MOT (Ministry of Transport)
<!-- - /mot -->
- /mot/dashboard

<!-- **bus-stops** -->
- /mot/bus-stops/add-new
- /mot/bus-stops
- /mot/bus-stops/[busStopId]/edit
- /mot/bus-stops/[busStopId]

<!-- **routes** -->
- /mot/routes
- /mot/routes/add-new
- /mot/routes/[routeGroupId]
- /mot/routes/[routeGroupId]/edit
<!-- - /mot/route-schedule/[routeId] -->

<!-- **schedules** -->
- /mot/schedules
- /mot/schedules/add-new
- /mot/schedules/[scheduleId]
- /mot/schedules/[scheduleId]/edit
- /mot/schedule-details/[id]

- /mot/trip-assignment

- /mot/users/operators
- /mot/users/operators/add-new
- /mot/users/operators/[operatorId]
- /mot/users/operators/[operatorId]/edit

- /mot/buses
- /mot/buses/add-new
- /mot/buses/[busId]
- /mot/buses/[busId]/edit

- /mot/passenger-service-permits
- /mot/passenger-service-permits/add-new
- /mot/passenger-service-permits/[permitId]
- /mot/passenger-service-permits/[permitId]/edit

- /mot/policy-update
- /mot/upload-policy
- /mot/policy-details/[id]
- /mot/edit-policy/[id]

- /mot/bus-fare
- /mot/bus-fare-details
- /mot/bus-fare-form

- /mot/broadcast-messages
- /mot/broadcast-message-view
- /mot/edit-messages
<!-- - /mot/Message-Management -->
<!-- - /mot/Pending-Messages -->
<!-- - /mot/Sent-Messages -->

- /mot/track-buses

- /mot/insights-analytics

<!-- - /mot/operator-management -->

<!-- - /mot/bus-permits -->


<!-- - /mot/staff-dashboard -->
<!-- - /mot/staff-details -->
<!-- - /mot/staff-form -->
<!-- - /mot/staff-management -->



## Operator

<!-- - /operator/login -->
- /operator/dashboard

- /operator/routepermit

- /operator/scheduleManagement
- /operator/editSchedule

- /operator/fleetmanagement
- /operator/editBusDetails
- /operator/busSeatView
- /operator/busTracking
- /operator/busLocation

- /operator/staffManagement
- /operator/addstaff
- /operator/revenueManagement

- /operator/profile



## TimeKeeper

<!-- - /timeKeeper -->
- /timeKeeper/dashboard
- /timeKeeper/schedule
- /timeKeeper/schedule-details/[id]
<!-- - /timeKeeper/schedule-details -->



## Admin

<!-- - /admin/login -->
- /admin

- /admin/users
- /admin/users/add-mot
- /admin/users/conductor/[id]
- /admin/users/fleet/[id]/bus/[busId]
- /admin/users/fleet/[id]
- /admin/users/mot/[id]
- /admin/users/passenger/[id]
- /admin/users/timekeeper/[id]

- /admin/notifications/compose
- /admin/notifications/detail/[id]
- /admin/notifications
- /admin/notifications/received
<!-- - /admin/notifications/received/[id] -->
- /admin/notifications/sent

<!-- - /admin/broadcast/history -->
<!-- - /admin/broadcast/message/[id] -->
<!-- - /admin/broadcast -->

- /admin/logs/application
- /admin/logs
- /admin/logs/security
- /admin/logs/user-activity

- /admin/monitoring/api-health
- /admin/monitoring/microservice-uptime
- /admin/monitoring
- /admin/monitoring/resource-usage

- /admin/analytics
- /admin/analytics/reports

- /admin/settings/backup
- /admin/settings

- /admin/profile

## Notes
- Routes with `[id]` or similar placeholders indicate dynamic routes where the segment is a parameter (e.g., `/admin/users/conductor/123`).
- Route groups (directories in parentheses like `(authenticated)`) are not part of the URL path.
- This list is generated from `page.tsx` files in the `src/app/` directory.
- Use this document to identify, check, and clean up unused or redundant pages in the project.