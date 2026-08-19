# DUAVERO — REST API Architecture & Endpoint Specification

> **Document Status**: APPROVED ARCHITECTURE SPECIFICATION  
> **Status Legend**: `[IMPLEMENTED]` | `[PLANNED]` | `[NOT YET IMPLEMENTED]`  
> *(Current Codebase Status: `[PLANNED]`)*

---

## 1. REST Conventions & URI Namespaces `[PLANNED]`

All API endpoints follow RESTful design standards and are strictly partitioned into 5 URI namespaces:

| Namespace | Intended Consumer | Authentication | Context Resolution |
| :--- | :--- | :--- | :--- |
| `/api/v1/public/**` | Public Marketplace Visitors | None (Anonymous) | Tenant Slug / Query |
| `/api/v1/auth/**` | Authentication Lifecycle | Anonymous / Basic | Request Body |
| `/api/v1/super-admin/**` | Platform Super Admin Portal | JWT (`SUPER_ADMIN`) | System Scope (`tenant_id = null`) |
| `/api/v1/tenant/**` | Tenant Owners, Admins, Staff | JWT (`TENANT_ADMIN`, `TENANT_STAFF`) | JWT Claim (`tenant_id`) |
| `/api/v1/customer/**` | End Customers | JWT (`CUSTOMER`) | Customer ID + Tenant Scope |

---

## 2. Standard Response Envelopes `[PLANNED]`

### 2.1 Standard Success Envelope (`ApiResponse<T>`)
```json
{
  "success": true,
  "message": "Quotation created successfully",
  "data": {
    "id": 1042,
    "quotationNumber": "QT-2026-0089",
    "totalAmount": 45000.00,
    "status": "DRAFT"
  },
  "timestamp": "2026-08-17T23:25:00Z",
  "correlationId": "req-9b8c-4f1a"
}
```

### 2.2 Standard Paginated Envelope (`PageResponse<T>`)
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Royal 3-Seater Sofa", "basePrice": 32000.00 }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 85,
  "totalPages": 5,
  "last": false,
  "correlationId": "req-8c2d-7f3e"
}
```

### 2.3 RFC 7807 Compliant Error Envelope
```json
{
  "type": "https://duavero.com/errors/cross-tenant-violation",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Requested invoice ID does not exist.",
  "instance": "/api/v1/tenant/invoices/999",
  "errorCode": "ERR_RESOURCE_NOT_FOUND",
  "timestamp": "2026-08-17T23:25:00Z",
  "correlationId": "req-3a1f-9e2c"
}
```

---

## 3. Core API Endpoint Catalog `[PLANNED]`

### 3.1 Super Admin Endpoints (`/api/v1/super-admin/`)
- `GET /tenants` — List tenants with status and package filtering.
- `POST /tenants/{id}/overrides/features` — Grant/revoke tenant feature overrides.
- `POST /tenants/{id}/overrides/limits` — Grant tenant numerical limit overrides.
- `GET /packages` — List all subscription packages.
- `POST /packages` — Create a new subscription package.
- `PUT /packages/{id}` — Update package pricing, billing cycles, and feature sets.
- `GET /categories` — Master category tree with dynamic attribute schemas.
- `POST /categories` — Create a dynamic master category.
- `POST /categories/{id}/attributes` — Define dynamic attributes for a category.
- `GET /schedulers` — List all registered scheduler jobs and status.
- `PUT /schedulers/{jobCode}` — Update scheduler cron, batch size, retry limit, or enabled state.
- `POST /schedulers/{jobCode}/trigger` — On-demand "Run Now" execution trigger.
- `GET /schedulers/logs` — Query scheduler execution telemetry.
- `GET /notifications/templates` — List and edit multi-channel notification templates.
- `GET /audit/logs` — Query platform-wide immutable audit trail.

### 3.2 Tenant Admin & Staff Endpoints (`/api/v1/tenant/`)
- `GET /profile` — Retrieve tenant business profile and branding.
- `PUT /profile` — Update branding, contact info, and GST numbers.
- `GET /categories/enabled` — List enabled categories for this tenant.
- `POST /categories/toggle` — Enable/disable master categories.
- `GET /service-areas` — List configured service locations.
- `POST /service-areas` — Configure serviceable cities/postal codes and delivery fees.
- `GET /products` — List products with dynamic attribute filters.
- `POST /products` — Create product with dynamic category specifications (`attributes_json`).
- `POST /products/excel/template` — Download dynamic Excel bulk import template.
- `POST /products/excel/upload` — Upload Excel workbook for asynchronous bulk import.
- `GET /products/excel/jobs/{jobId}` — Check bulk import progress and error logs.
- `GET /customers` — Customer CRM directory.
- `POST /customers` — Create or update customer contact record.
- `GET /enquiries` — List customer requirement enquiries.
- `PUT /enquiries/{id}/status` — Update enquiry pipeline status (`NEW`, `CONTACTED`, etc.).
- `POST /quotations` — Create quotation with line items and dynamic measurements.
- `POST /quotations/{id}/revise` — Create a new revision (`REV-2`) from an existing quote.
- `POST /quotations/{id}/send` — Issue quotation and dispatch customer notifications.
- `GET /quotations/{id}/pdf` — Generate and stream quotation PDF.
- `POST /invoices/generate-from-quote/{quoteId}` — Convert accepted quote to sequential invoice.
- `POST /payments` — Record payment against invoice.
- `GET /dashboard/kpis` — Fetch dynamic dashboard KPI cards.

### 3.3 Customer Endpoints (`/api/v1/customer/`)
- `GET /quotations/{id}` — View quotation breakdown and line-item specifications.
- `POST /quotations/{id}/accept` — Accept quotation and trigger advance payment link.
- `POST /quotations/{id}/reject` — Reject quotation with feedback reason.
- `GET /invoices/{id}` — View tax invoice and balance due.
- `POST /invoices/{id}/pay` — Initiate online payment gateway checkout session.
- `POST /reviews` — Submit verified customer review and star rating.

### 3.4 Public Marketplace Endpoints (`/api/v1/public/`)
- `GET /storefronts/{slug}` — Public tenant business profile, branding, and catalog.
- `GET /categories` — Browse public master categories.
- `POST /storefronts/{slug}/enquiries` — Submit customer requirement inquiry.
