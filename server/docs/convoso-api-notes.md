# Convoso API Integration Notes

## Overview

The Convoso API is used to pull weekly agent performance and list contact rate reports. Authentication uses a Bearer token.

## Configuration

Set these in `server/.env`:

```
CONVOSO_BASE_URL=https://api.convoso.com
CONVOSO_API_KEY=your_api_key_here
```

The API key can also be stored hot-reload style in the `AppSetting` table under key `convosoApiKey` — if present, this overrides the env var.

## Endpoints Used

### Agent Performance Report
```
GET /v1/reports/agent-performance
  ?start_date=YYYY-MM-DD
  &end_date=YYYY-MM-DD
  &group_by=agent
```

**TODO**: Verify exact endpoint path. Common alternatives:
- `/v1/reports/agent`
- `/v1/agent-report`
- `/api/v1/reports/agent-performance`

**Expected response shape:**
```json
{
  "data": [
    {
      "agent_id": "...",
      "agent_name": "...",
      "total_calls": 312,
      "contacts": 187,
      "scheduled": 42,
      "hang_up": 56,
      "not_good_fit": 38,
      "follow_up": 22,
      "already_scheduled": 11,
      "duplicate": 6,
      "no_answer": 89,
      "talk_time_sec": 25200,
      "pause_time_sec": 2280,
      "wrap_time_sec": 4320,
      "login_time_sec": 36600
    }
  ]
}
```

**TODO**: Confirm actual field names. On first run, check the server logs for:
```
[Convoso] Raw agent report sample: { ... }
```
Then update `mapAgentRow()` in `server/services/convosoService.js`.

### List Contact Rate Report
```
GET /v1/reports/list-contact-rate
  ?start_date=YYYY-MM-DD
  &end_date=YYYY-MM-DD
```

**TODO**: Verify exact endpoint path and response shape.

## Field Mapping

Field mapping lives in `server/services/convosoService.js` in the `mapAgentRow()` function. Update the field names there once a real API response is captured.

## Testing

To verify the integration without running a full sync:
1. Add `CONVOSO_API_KEY` to `server/.env`
2. Run the server: `npm run dev`
3. Login as admin and trigger a manual sync from the Admin page
4. Watch server logs for `[Convoso] Raw agent report sample:`
5. Update `mapAgentRow()` with correct field names
6. Re-run sync

## EOD Survey Data

The `eodYes` / `eodNo` fields may not be available directly in the performance report. Check if Convoso provides a separate survey/disposition report endpoint.

## Pagination

If the API returns paginated results, add a `page` parameter loop in `getAgentReport()`. The current implementation assumes all results fit in one request.
