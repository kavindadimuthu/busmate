# API Configuration Guide

## Service Architecture

Your app uses `api-gateway` as the main backend entry point and can still target individual services directly for debugging.

### 1. **User Service** (`user`)
- **Port:** 9020 through gateway 8080
- **Handles:** Authentication, conductor profiles, notifications
- **Base URL:** `http://localhost:8080/api`

### 2. **Core Service** (`schedule`)
- **Port:** 9010 through gateway 8080
- **Handles:** Schedules, trips, routes, analytics, employee shifts
- **Base URL:** `http://localhost:8080/api`

### 3. **Ticket Management Service** (`ticket`)
- **Port:** 9030 through gateway 8080
- **Handles:** Ticket validation, issuing, scanning, printing
- **Base URL:** `http://localhost:8080/api`

## Environment Variables

Configure different base URLs using environment variables:

```bash
# .env
EXPO_PUBLIC_API_GATEWAY_URL=http://localhost:8080
EXPO_PUBLIC_USER_API_URL=http://localhost:8080/api
EXPO_PUBLIC_SCHEDULE_API_URL=http://localhost:8080/api
EXPO_PUBLIC_TICKET_API_URL=http://localhost:8080/api
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
| `authApi` | `user` | 9020 via 8080 | Login, logout, token validation |
| `employeeApi.getProfile()` | `user` | 9020 via 8080 | Conductor profile data |
| `employeeApi.getSchedule()` | `schedule` | 9010 via 8080 | Conductor schedules |
| `journeyApi` | `schedule` | 9010 via 8080 | Trip management |
| `ticketApi` | `ticket` | 9030 via 8080 | Ticket operations |
| `notificationApi` | `user` | 9020 via 8080 | Notifications |
| `analyticsApi` | `schedule`/`ticket` | 9010/9030 via 8080 | Reports and analytics |

## Configuration Updates

The following files were updated:
- `src/config/apiConfig.ts` - Service configuration
- `src/services/apiClient.ts` - Multi-service API client
- `src/services/api/*.ts` - Individual API modules
- `.env` files - Environment variables
