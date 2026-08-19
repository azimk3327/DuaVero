# ADR-0003: Hybrid Relational + JSON Model for Dynamic Attributes

## Context
Tenants in diverse industries (Sofa vs Curtain vs Tile vs Woodwork) require vastly different product attributes, measurement dimensions, and specifications. Classic Entity-Attribute-Value (EAV) models lead to complex multi-join queries, terrible query performance, and fragile ORM mappings.

## Decision
We adopt a **Hybrid Relational + JSON Document Model** in MySQL 8.0+:
1. Fixed core properties (id, tenant_id, category_id, sku, price, tax, status) live in standard relational columns.
2. Industry-specific dynamic attributes reside in a JSON column (`attributes_json`).
3. Super Admin defines the JSON schema and validation rules in `attribute_definitions` and `category_attributes`.
4. High-frequency search attributes leverage MySQL 8.0 functional indexes or virtual generated columns.

## Consequences
- **Positive**: High query performance, clean schema, zero schema migrations when Super Admin adds a new attribute, full typing and validation enforced at API ingress.
- **Negative**: Dynamic JSON validation logic must be executed at application layer before database persistence.
