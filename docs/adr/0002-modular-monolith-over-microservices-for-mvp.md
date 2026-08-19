# ADR-0002: Modular Monolith Architecture over Microservices

## Context
We need to balance initial velocity, simplicity of deployment, transactional consistency, and future scalability.

## Decision
We choose a **Modular Monolith** using Spring Boot 3.x with strictly demarcated package boundaries adhering to Hexagonal/Clean Architecture principles. Domain modules communicate strictly via clear interface contracts, public DTOs, and Spring Application Events.

## Consequences
- **Positive**: Single deployment unit, zero distributed transaction overhead (no two-phase commits or Sagas needed for MVP), streamlined CI/CD, simplified local development.
- **Positive**: Low barrier to extracting high-load modules (e.g. `notification`, `scheduler`, `analytics`) into standalone microservices in Phase 4.
- **Negative**: Monolithic memory footprint requires careful resource sizing.
