import type { ServiceDefinition } from "@/types/service";

const SERVICES: ServiceDefinition[] = [
  {
    id: "api-core",
    name: "Route & Schedule Service",
    shortName: "API Core",
    description: "Core API for routes, stops, schedules, trips, fleet, and licensing",
    baseUrl: import.meta.env.VITE_API_CORE_URL || "http://localhost:8080",
    openApiPath: "/v3/api-docs",
    actuatorPath: "/actuator",
    color: "#3b82f6",
    icon: "Route",
  },
  {
    id: "user-management",
    name: "User Management Service",
    shortName: "User Mgmt",
    description: "User authentication, authorization, and profile management",
    baseUrl: import.meta.env.VITE_USER_MGMT_URL || "http://localhost:8081",
    openApiPath: "/v3/api-docs",
    actuatorPath: "/actuator",
    color: "#8b5cf6",
    icon: "Users",
  },
  {
    id: "notification",
    name: "Notification Service",
    shortName: "Notification",
    description: "Push notifications, email, and SMS communication",
    baseUrl: import.meta.env.VITE_NOTIFICATION_URL || "http://localhost:8082",
    openApiPath: "/v3/api-docs",
    actuatorPath: "/actuator",
    color: "#f59e0b",
    icon: "Bell",
  },
  {
    id: "location-tracking",
    name: "Location Tracking Service",
    shortName: "Location",
    description: "Real-time GPS tracking and geofencing for buses",
    baseUrl: import.meta.env.VITE_LOCATION_URL || "http://localhost:4000",
    openApiPath: "/api-spec",
    actuatorPath: "/actuator",
    color: "#10b981",
    icon: "MapPin",
  },
];

export function getServices(): ServiceDefinition[] {
  return SERVICES;
}

export function getServiceById(id: string): ServiceDefinition | undefined {
  return SERVICES.find((s) => s.id === id);
}

export function getDefaultService(): ServiceDefinition {
  return SERVICES[0];
}
