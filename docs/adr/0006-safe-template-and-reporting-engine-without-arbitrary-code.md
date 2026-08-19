# ADR-0006: Zero-Code Execution Safe Template & Report Engine

## Context
Allowing dynamic notification templates, dynamic form calculations, and custom reporting introduces massive security risks (Server-Side Template Injection / SSTI, arbitrary SQL injection, Remote Code Execution / RCE).

## Decision
1. **Notification Templates**: Use logic-less Mustache parser with a strict whitelist of registered domain variables (`{{businessName}}`, `{{amount}}`, `{{invoiceNumber}}`). Prohibit any arbitrary expression evaluation or method invocation.
2. **Reporting Engine**: Eliminate all raw SQL input. Reports are built entirely on server-side pre-compiled Spring Data JPA Specifications and QueryDSL projections with strongly-typed JSON filter parameter bindings.

## Consequences
- **Positive**: Complete elimination of SSTI and SQL Injection vulnerabilities; Super Admin retains full control over messaging copy and report parameterization safely.
- **Negative**: Highly complex one-off mathematical calculations or custom database joins require developer implementation of a new registered query handler.
