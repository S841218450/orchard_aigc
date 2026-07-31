# Fix: Delete API Sending Duplicate Requests

## Summary
`API.deleteWork(message.id)` sends two identical POST requests. Root cause: the duplicate request detection in the axios interceptor has an inverted condition, so it never actually blocks duplicates.

## Root Cause
In `src/api/config/request.ts` line 87:
```ts
if (!config.url && requestQueue.isDuplicate(config)) {
```
This condition is **inverted** - it only checks for duplicates when `config.url` is falsy. But all normal API calls have a URL, so the duplicate check is always skipped.

## Fix

### File: `src/api/config/request.ts` (line 87)
Change:
```ts
if (!config.url && requestQueue.isDuplicate(config)) {
```
To:
```ts
if (config.url && requestQueue.isDuplicate(config)) {
```

This is a one-line fix. When `config.url` exists (all normal requests), the duplicate check will now run properly via `requestQueue.isDuplicate()`.

## Verification
1. Navigate to creation page
2. Click delete on a history item
3. Verify only one request to `/admin-api/api/ai/work/delete` appears in Network tab
4. Verify the delete still works correctly (item removed from list after fade-out animation)
