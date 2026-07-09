#!/usr/bin/env bash
#
# Seed demo tickets/bookings for a conductor's ongoing trip so the Journeys-tab seat map and
# ticket list are populated for testing.
#
# It logs in as a conductor, finds their currently-active trip (or a TRIP_ID you pass),
# discovers the trip's bus + route stops, and issues a mix of tickets through the REAL
# ticketing-service endpoint (via the api-gateway):
#   - CASH tickets  -> issueMethod CONDUCTOR, status VALID    -> render as "validated" (blue)
#   - ONLINE tickets -> issueMethod ONLINE,   status NOT_VALID -> render as "booked" (yellow),
#                        which the conductor can then validate from the app.
#
# Requires: curl, python3, and all services running (api-gateway :8080, core-service :9010,
# ticketing-service :9030). Idempotent-ish: re-running issues more tickets (ticketing has no
# unique seat constraint), so run once per fresh trip.
#
# Usage:
#   scripts/seed-trip-tickets.sh
#   EMAIL=conductor.nirosha@busmate.test PASSWORD=Conductor2@2026 scripts/seed-trip-tickets.sh
#   TRIP_ID=<uuid> scripts/seed-trip-tickets.sh
set -euo pipefail

GATEWAY="${GATEWAY:-http://localhost:8080}"
EMAIL="${EMAIL:-conductor.saman@busmate.test}"
PASSWORD="${PASSWORD:-Conductor1@2026}"
CASH_SEATS="${CASH_SEATS:-6}"      # seats 1..CASH_SEATS -> validated cash tickets
ONLINE_SEATS="${ONLINE_SEATS:-6}"  # next ONLINE_SEATS seats -> booked online tickets

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }

say "Logging in as $EMAIL ..."
LOGIN=$(curl -s -X POST "$GATEWAY/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(printf '%s' "$LOGIN" | python3 -c "import json,sys;print(json.load(sys.stdin).get('accessToken',''))")
[ -n "$TOKEN" ] || { echo "Login failed: $LOGIN"; exit 1; }

# conductorId = the JWT subject (user-service userId)
CONDUCTOR_ID=$(printf '%s' "$TOKEN" | python3 -c "
import sys,base64,json
p=sys.stdin.read().split('.')[1]; p+='='*(-len(p)%4)
print(json.loads(base64.urlsafe_b64decode(p)).get('sub',''))")
echo "conductorId=$CONDUCTOR_ID"

say "Finding the conductor's trip ..."
TRIPS=$(curl -s "$GATEWAY/api/v1/conductor/$CONDUCTOR_ID/trips" -H "Authorization: Bearer $TOKEN")
read -r TRIP_ID BUS_ID ROUTE_ID <<EOF
$(printf '%s' "$TRIPS" | TRIP_ID="${TRIP_ID:-}" python3 -c "
import json,sys,os
trips=json.load(sys.stdin)
want=os.environ.get('TRIP_ID') or ''
pick=None
if want:
    pick=next((t for t in trips if t['id']==want), None)
if not pick:
    pick=next((t for t in trips if t.get('status')=='active'), None)   # ongoing first
if not pick and trips:
    pick=trips[0]
if not pick:
    print(''); sys.exit()
print(pick['id'], pick.get('busId') or '', pick.get('routeId') or '')")
EOF
[ -n "${TRIP_ID:-}" ] || { echo "No trip found for this conductor."; exit 1; }
echo "tripId=$TRIP_ID busId=$BUS_ID routeId=$ROUTE_ID"

say "Fetching route stops (for ticket start/end locations) ..."
STOPS=$(curl -s "$GATEWAY/api/stops/route/$ROUTE_ID" -H "Authorization: Bearer $TOKEN")
read -r START_LOC END_LOC <<EOF
$(printf '%s' "$STOPS" | python3 -c "
import json,sys
data=json.load(sys.stdin)
items=data if isinstance(data,list) else data.get('content',[])
ids=[s.get('id') or s.get('stopId') or s.get('routeStopId') for s in items]
ids=[i for i in ids if i]
print(ids[0] if ids else '', ids[-1] if len(ids)>1 else (ids[0] if ids else ''))")
EOF
[ -n "${START_LOC:-}" ] || { echo "Could not resolve route stops; got: $STOPS"; exit 1; }
echo "startLocationId=$START_LOC endLocationId=$END_LOC"

issue() {
  local seat="$1" method="$2" fare="$3"
  local body
  body=$(python3 -c "
import json,sys
print(json.dumps({
  'conductorId': '$CONDUCTOR_ID',
  'busId': '$BUS_ID',
  'tripId': '$TRIP_ID',
  'startLocationId': '$START_LOC',
  'endLocationId': '$END_LOC',
  'fareAmount': $fare,
  'paymentMethod': '$method',
  'transactionRef': 'SEED-$method-$seat-$(date +%s)',
  'seatNumber': '$seat',
  'passengerId': 'PSGR-$seat'
}))")
  curl -s -X POST "$GATEWAY/api/v1/tickets/conductor/issue" \
    -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
    -d "$body" >/dev/null && echo "  seat $seat ($method) ✓" || echo "  seat $seat ($method) ✗"
}

say "Issuing $CASH_SEATS cash (validated) + $ONLINE_SEATS online (booked) tickets ..."
seat=1
for _ in $(seq 1 "$CASH_SEATS");   do issue "$seat" CASH   $((200 + RANDOM % 300)); seat=$((seat+1)); done
for _ in $(seq 1 "$ONLINE_SEATS"); do issue "$seat" ONLINE $((200 + RANDOM % 300)); seat=$((seat+1)); done

say "Done. Open the Journeys tab -> Bookings for trip $TRIP_ID to see the seat map."
