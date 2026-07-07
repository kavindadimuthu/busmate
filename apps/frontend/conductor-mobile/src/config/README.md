# API Configuration Guide

## Service Architecture

Your app now supports **3 different microservices** with separate base URLs:

### 1. **User Management Service** (`user`)
- **Port:** 8081
- **Handles:** Authentication, conductor profiles, notifications
- **Base URL:** `http://18.140.161.237:8081/api`

### 2. **Schedule Management Service** (`schedule`)
- **Port:** 8080  
- **Handles:** Schedules, trips, routes, analytics, employee shifts
- **Base URL:** `http://18.140.161.237:8080/api`

### 3. **Ticket Management Service** (`ticket`)
- **Port:** 8083
- **Handles:** Ticket validation, issuing, scanning, printing
- **Base URL:** `http://54.91.217.117:8083/api`

## Environment Variables

Configure different base URLs using environment variables:

```bash
# .env
EXPO_PUBLIC_USER_API_URL=18.140.161.237:8081/api
EXPO_PUBLIC_SCHEDULE_API_URL=18.140.161.237:8080/api
EXPO_PUBLIC_TICKET_API_URL=54.91.217.117:8083/api
```

## Usage Examples

### Authentication (User Service)
```typescript
import { authApi } from '@/services/api/auth';

// Login
const response = await authApi.login(credentials);
```

### Schedules (Schedule Service)  
```typescript
import { journeyApi } from '@/services/api/journey';

// Get schedules
const schedules = await journeyApi.getSchedules();
```

### Tickets (Ticket Service)
```typescript
import { ticketApi } from '@/services/api/ticket';

// Validate ticket
const result = await ticketApi.validateTicket(ticketId);
```

## API Client Features

- ✅ **Multiple Service Support** - Automatically routes to correct service
- ✅ **Request Deduplication** - Prevents duplicate API calls
- ✅ **Environment Configuration** - Easy switching between dev/prod
- ✅ **Enhanced Logging** - Clear visibility into API calls
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Token Management** - Automatic auth token handling

## Service Mapping

| API Module | Service Type | Port | Purpose |
|------------|-------------|------|---------|
| `authApi` | `user` | 8081 | Login, logout, token validation |
| `employeeApi.getProfile()` | `user` | 8081 | Conductor profile data |
| `employeeApi.getSchedule()` | `schedule` | 8080 | Conductor schedules |
| `journeyApi` | `schedule` | 8080 | Trip management |
| `ticketApi` | `ticket` | 8083 | Ticket operations |
| `notificationApi` | `user` | 8081 | Notifications |
| `analyticsApi` | `schedule`/`ticket` | 8080/8083 | Reports and analytics |

## Configuration Updates

The following files were updated:
- `src/config/apiConfig.ts` - Service configuration
- `src/services/apiClient.ts` - Multi-service API client
- `src/services/api/*.ts` - Individual API modules
- `.env` files - Environment variables
