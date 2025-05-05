# Hands-on project

**Work in progress**

This repository serves as a hands‑on demonstration of my experience with the following system design technologies:
* Nest.js
* DDD + Clean architecture
* Redis
* * Shared cache and cache invalidation
* * Pub/Sub
* * Rate limiting
* * Multi‑instance support
* Docker
* GraphQL
* PostgreSQL
* Stripe integration
* * Subscriptions
* * Refunds
* * Cancellations
* * Webhooks
* Error handling & logs monitoring
* Unit & E2E tests

This project implements the business logic for a library application. A library holds many books; each book has a single author and can belong to multiple categories. Users can rent books and subscribe to plans. The API supports full CRUD for authors, books, categories, users, subscriptions, plans, and payments. CI/CD pipelines are configured with container orchestration and multi‑instance deployment for production readiness.

## Author

Rafael Rodrigues
