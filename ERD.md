# Data model (SAP-style), Phase 1 target

Money columns are `bigint` paise. Business dates are `date`; timestamps `timestamptz`. Every table has `company_id` (row-level security), `created_by/at`, `updated_by/at`.

```mermaid
erDiagram
  COMPANY ||--o{ PLANT : has
  PLANT ||--o{ STORAGE_LOCATION : has
  COMPANY ||--o{ APP_USER : employs
  APP_USER }o--o{ ROLE : "user_role"
  ROLE }o--o{ PERMISSION : "role_permission"
  BUYER ||--o{ SHIP_TO : delivers_to
  MATERIAL ||--o{ BUYER_MATERIAL_MAP : "valid_from/to"
  BUYER ||--o{ BUYER_MATERIAL_MAP : maps
  MATERIAL ||--o{ PRICE_MRP : "EasyEcom authoritative, dated"
  BUYER ||--o{ MOQ_RULE : has
  PURCHASE_ORDER ||--|{ PO_ITEM : contains
  BUYER ||--o{ PURCHASE_ORDER : issues
  SHIP_TO ||--o{ PURCHASE_ORDER : "ship-to"
  PLANT ||--o{ PURCHASE_ORDER : "fulfilled from"
  PO_ITEM }o--|| MATERIAL : "resolved to"
  PURCHASE_ORDER ||--o{ SALES_ORDER : "punched as (EasyEcom)"
  SALES_ORDER ||--o{ PACKING : packed_in
  PURCHASE_ORDER ||--o{ APPOINTMENT : "request/confirm/reschedule/miss"
  PACKING ||--o{ DELIVERY : "dispatched (AWB/LR)"
  CARRIER ||--o{ DELIVERY : carries
  DELIVERY ||--o{ INVOICE : billed_by
  DELIVERY ||--o| POD : proven_by
  INVOICE ||--o{ GRN : received_as
  GRN ||--o{ CLAIM : "short / price diff"
  INVOICE ||--o{ PAYMENT : settled_by
  CLAIM ||--o{ DEDUCTION : results_in
  PURCHASE_ORDER ||--o{ EXCEPTION : "hold, cancel, MRP mismatch, price diff, demurrage"
  DOCUMENT_FLOW }o--|| PURCHASE_ORDER : "source/target (polymorphic)"
  NUMBER_RANGE ||--o{ PURCHASE_ORDER : numbers
  AUDIT_LOG }o--|| APP_USER : "who"
  FILE_OBJECT }o--o{ PURCHASE_ORDER : "PDF/Excel, sha256, retention"
```

Key rules: posted documents immutable (status `POSTED` → only `REVERSED` via a reversal document); `DOCUMENT_FLOW(source_type, source_id, target_type, target_id, link_type)`; `AUDIT_LOG(user, at, object_type, object_id, field, old, new, reason)` written in the same transaction as the change.
