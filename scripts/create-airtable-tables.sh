#!/bin/bash
# Create Orders and Watches tables in the Frontend Lead Capture Airtable base.
# Requires: AIRTABLE_API_KEY env var with schema write scope.
# Usage: AIRTABLE_API_KEY=pat... bash scripts/create-airtable-tables.sh

set -e
BASE_ID="appaf8mnGx7nO6f3B"

if [ -z "$AIRTABLE_API_KEY" ]; then
  echo "Set AIRTABLE_API_KEY first"
  exit 1
fi

echo "Creating Orders table..."
curl -s -X POST "https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
  "name": "Orders",
  "fields": [
    {"name": "Email", "type": "email"},
    {"name": "Name", "type": "singleLineText"},
    {"name": "Amount", "type": "currency", "options": {"precision": 2, "symbol": "$"}},
    {"name": "StripeSessionId", "type": "singleLineText"},
    {"name": "EventId", "type": "singleLineText"},
    {"name": "OrderTS", "type": "dateTime", "options": {"timeZone": "America/New_York", "dateFormat": {"name": "iso"}, "timeFormat": {"name": "24hour"}}},
    {"name": "FT_Source", "type": "singleLineText"},
    {"name": "FT_Referrer", "type": "singleLineText"},
    {"name": "FT_LandingPage", "type": "singleLineText"},
    {"name": "FT_MyaptPage", "type": "singleLineText"},
    {"name": "FT_Timestamp", "type": "singleLineText"},
    {"name": "DaysToPurchase", "type": "number", "options": {"precision": 0}},
    {"name": "ToolTouch", "type": "checkbox", "options": {"icon": "check", "color": "greenBright"}},
    {"name": "Verdict", "type": "singleSelect", "options": {"choices": [{"name": "tool-lead"}, {"name": "content-lead"}, {"name": "direct"}, {"name": "unknown"}]}},
    {"name": "SelfReport", "type": "singleLineText"},
    {"name": "Status", "type": "singleSelect", "options": {"choices": [{"name": "paid"}, {"name": "refunded"}, {"name": "disputed"}]}},
    {"name": "PromisedBy", "type": "date", "options": {"dateFormat": {"name": "iso"}}},
    {"name": "QuotedShip", "type": "singleLineText"},
    {"name": "ActualShip", "type": "singleLineText"},
    {"name": "Tracking", "type": "singleLineText"},
    {"name": "Delivered", "type": "singleLineText"},
    {"name": "CheckIn", "type": "singleLineText"},
    {"name": "UnitCost", "type": "currency", "options": {"precision": 2, "symbol": "$"}},
    {"name": "ShippingCost", "type": "currency", "options": {"precision": 2, "symbol": "$"}}
  ]
}' | python3 -c "import json,sys; d=json.load(sys.stdin); print('Orders:', d.get('id','ERROR'), d.get('name',''), d.get('error',{}).get('message',''))"

echo ""
echo "Creating Watches table..."
curl -s -X POST "https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
  "name": "Watches",
  "fields": [
    {"name": "Item", "type": "singleLineText"},
    {"name": "Due", "type": "date", "options": {"dateFormat": {"name": "iso"}}},
    {"name": "Notes", "type": "singleLineText"},
    {"name": "Done", "type": "checkbox", "options": {"icon": "check", "color": "greenBright"}}
  ]
}' | python3 -c "import json,sys; d=json.load(sys.stdin); print('Watches:', d.get('id','ERROR'), d.get('name',''), d.get('error',{}).get('message',''))"

echo ""
echo "Seeding Watches rows..."
curl -s -X POST "https://api.airtable.com/v0/${BASE_ID}/Watches" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
  "records": [
    {"fields": {"Item": "Rohil check-in: review ask + before/after strips", "Due": "2026-08-25"}},
    {"fields": {"Item": "Arius recheck: PDP ship status → site page + Medium post 5 re-date", "Due": "2026-08-31"}},
    {"fields": {"Item": "Weekly GSC pull (first combined both domains)", "Due": "2026-08-19"}},
    {"fields": {"Item": "Cathy: tracking both shipments (URGENT)", "Due": "2026-08-15"}},
    {"fields": {"Item": "Cathy: strips-standard confirmation → restore sweep trigger"}},
    {"fields": {"Item": "Cathy: blind-packing confirmation + label photo proof"}}
  ]
}' | python3 -c "import json,sys; d=json.load(sys.stdin); recs=d.get('records',[]); print(f'Seeded {len(recs)} rows'); [print(f'  {r[\"id\"]}: {r[\"fields\"].get(\"Item\",\"\")}') for r in recs]"

echo ""
echo "Done. Add AIRTABLE_API_KEY and AIRTABLE_BASE_ID=${BASE_ID} to the AG Vercel project if not already set."
