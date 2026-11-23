# API (REST + OpenAPI, Phase 1+). All endpoints scoped by company; RBAC per role.

| Method | Path | Purpose | Roles |
|---|---|---|---|
| POST | /auth/login, /auth/mfa, GET /auth/google | Sign-in (password+MFA or Google Workspace SSO) | all |
| GET/POST/PATCH | /master/materials, /buyers, /ship-tos, /buyer-material-maps, /mrp, /carriers, /moq-rules | Master data (validity-dated) | Admin, Manager (write); others read |
| POST | /imports/master-tracker?dryRun=true | Import Google Sheet export → diff → commit/rollback | Admin |
| POST | /po/intake (multipart) | Upload PO file → parse job | Ops |
| GET | /po/intake/{job} | Parse result: items, checks, unparsed lines | Ops |
| POST | /po/{id}/post | Post PO (number range, immutable) | Ops, Manager |
| POST | /po/{id}/reverse | Reversal document (reason required) | Manager |
| POST | /po/{id}/easyecom-csv | EasyEcom punch file (API later) | Ops |
| GET | /po?filter=…&cursor=… | PO list (50k rows, server-side filter) | all |
| POST | /appointments, PATCH /appointments/{id} | Request/confirm/reschedule/miss | Ops, Warehouse |
| POST | /deliveries, PATCH /deliveries/{id} | Dispatch (AWB/LR), transit, delivered, POD | Warehouse |
| POST | /invoices/intake, POST /reconcile/3way | Invoice intake, PO↔invoice↔GRN check | Finance |
| GET/POST | /claims, /deductions | Claim register | Finance |
| GET | /reports/{name}?format=pdf|xlsx | Control tower, scheduled reports | Manager |
| GET | /audit?object=… | Audit trail | Admin, Manager |
| POST | /integrations/gmail/poll, /integrations/easyecom/sync | Jobs (idempotency key, retries, DLQ) | system |
