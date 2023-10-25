# API endpoints

All requests are in JSON unless specified otherwise

## /api/register
Request:
- displayName string
- idtoken string

## /api/login
Request:
- idtoken string

Response:
- role int

## /api/sendmsg
The message is the body of the request for this endpoint.

## /api/recvmsg
EventSource endpoint.

## /api/senddm
Request:
- idtoken string
- sendto string
- message string

## /api/dmlist
Request:
- idtoken string

Response:
Array of displayNames

## /api/recvdm
Request:
- idtoken string
- recvfrom string
- afterTimestamp int

Response:
Array of messages
