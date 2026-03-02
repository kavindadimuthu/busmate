# Staff Management Service - URL Migration Summary

## Changes Made

### 1. Removed Commented Staff Proxy
**File**: `next.config.ts`

**Before**:
```typescript
// {
//   source: '/api/staff/:path*',
//   destination: 'http://107.21.189.199:8081/api/:path*'
// }
```

**After**: Removed completely

---

### 2. Updated Constants to Use User Management Proxy
**File**: `src/lib/constants.ts`

**Before**:
```typescript
export const STAFF_API_BASE = process.env.NEXT_PUBLIC_STAFF_API_BASE || '/api/staff';
```

**After**:
```typescript
export const STAFF_API_BASE = process.env.NEXT_PUBLIC_STAFF_API_BASE || '/api/user-management';
```

---

### 3. Updated All Service Endpoints with /api Prefix
**File**: `src/lib/services/staff-management-service.ts`

All endpoints now include `/api` in their paths:

| Endpoint | Old Path | New Path |
|----------|----------|----------|
| Get All Conductors | `${baseUrl}/conductor/all` | `${baseUrl}/api/conductor/all` |
| Register Conductor | `${baseUrl}/conductor/register` | `${baseUrl}/api/conductor/register` |
| Update Conductor | `${baseUrl}/conductor/profile/{id}` | `${baseUrl}/api/conductor/profile/{id}` |
| Delete Conductor | `${baseUrl}/conductor/profile/{id}` | `${baseUrl}/api/conductor/profile/{id}` |
| Delete Driver | `${baseUrl}/driver/profile/{id}` | `${baseUrl}/api/driver/profile/{id}` |

---

## How It Works Now

### Request Flow

1. **Frontend Service Call**:
   ```typescript
   fetch('/api/user-management/api/conductor/all', {
     headers: { 'Authorization': `Bearer ${token}` }
   })
   ```

2. **Next.js Proxy (in next.config.ts)**:
   - Matches: `/api/user-management/:path*`
   - Destination: `http://107.21.189.199:8081/:path*`
   - Result: `http://107.21.189.199:8081/api/conductor/all`

3. **Backend Receives**:
   - Full URL: `http://107.21.189.199:8081/api/conductor/all`
   - With Authorization header

---

## URL Breakdown

### Frontend to Next.js Server
```
Browser → /api/user-management/api/conductor/all
```

### Next.js Server to Backend
```
Next.js → http://107.21.189.199:8081/api/conductor/all
```

The proxy strips `/api/user-management` and forwards the rest (`:path*` = `api/conductor/all`)

---

## Testing with Postman

### Direct Backend Testing (bypassing frontend)

**Base URL**: `http://107.21.189.199:8081`

**All Conductor Endpoints**:
- GET `http://107.21.189.199:8081/api/conductor/all`
- POST `http://107.21.189.199:8081/api/conductor/register`
- PUT `http://107.21.189.199:8081/api/conductor/profile/{userId}`
- DELETE `http://107.21.189.199:8081/api/conductor/profile/{userId}`

**Headers**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

---

## Why This Approach?

### Advantages
✅ **Single proxy**: Reuses existing `/api/user-management` proxy  
✅ **No duplication**: No separate staff proxy needed  
✅ **Consistent**: All user/staff operations go through same service  
✅ **Simpler config**: Fewer rewrite rules to maintain  
✅ **Same backend**: User Management Service at 107.21.189.199:8081 handles both users and staff

### Path Structure
- User Management uses: `http://107.21.189.199:8081` as base
- Staff operations are part of User Management API
- All require `/api` prefix: `/api/conductor/*`, `/api/driver/*`

---

## Migration Checklist

- [x] Remove commented `/api/staff` proxy from next.config.ts
- [x] Update STAFF_API_BASE to `/api/user-management`
- [x] Add `/api` prefix to all conductor endpoints
- [x] Add `/api` prefix to all driver endpoints
- [x] Update service constructor comment
- [x] Update Postman documentation
- [x] Verify no TypeScript errors

---

## Testing After Migration

### Quick Frontend Test
1. Start dev server: `npm run dev`
2. Login to get access token
3. Navigate to Staff Management page
4. Try to:
   - View list of conductors
   - Add new conductor
   - Edit conductor details
   - Delete conductor

### Expected Results
- All operations should work without CORS errors
- Frontend makes requests to `/api/user-management/api/conductor/*`
- Next.js proxies to `http://107.21.189.199:8081/api/conductor/*`
- Backend processes requests normally

---

## Troubleshooting

### Issue: 404 Not Found
**Check**: Is the backend API path correct?
- Backend must support `/api/conductor/*` routes
- Verify with direct Postman call: `GET http://107.21.189.199:8081/api/conductor/all`

### Issue: 403 Forbidden
**Check**: Authorization token
- Token must be valid and not expired
- Token must have operator permissions
- Try re-authenticating

### Issue: CORS Error
**Should not happen** if using the proxy correctly
- Frontend should call `/api/user-management/*` (relative path)
- Never call `http://107.21.189.199:8081` directly from browser

---

## Files Changed

1. ✅ `next.config.ts` - Removed commented staff proxy
2. ✅ `src/lib/constants.ts` - Updated STAFF_API_BASE
3. ✅ `src/lib/services/staff-management-service.ts` - Added /api to all paths
4. ✅ `docs/postman-staff-api-testing.md` - Updated documentation

---

## Environment Variables (Optional)

If you need to change the base URL, set this in `.env.local`:

```env
NEXT_PUBLIC_STAFF_API_BASE=/api/user-management
```

Or for direct backend calls (without proxy):
```env
NEXT_PUBLIC_STAFF_API_BASE=http://107.21.189.199:8081/api
```

But **recommend keeping the proxy** to avoid CORS issues.
