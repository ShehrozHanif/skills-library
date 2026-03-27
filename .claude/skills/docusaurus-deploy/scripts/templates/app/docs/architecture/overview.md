---
sidebar_position: 1
---

# Architecture Overview

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER                     │
│                                                          │
│  ┌─────────────┐    ┌─────────────────────────────────┐  │
│  │   Next.js   │    │    LearnFlow Namespace           │  │
│  │  Frontend   │───▶│  ┌─────────┐  ┌──────────────┐  │  │
│  │  + Monaco   │    │  │ Triage  │  │  Concepts    │  │  │
│  └─────────────┘    │  │ Agent   │──│  CodeReview  │  │  │
│                     │  │ (Dapr)  │  │  Debug       │  │  │
│  ┌─────────────┐    │  └────┬────┘  │  Exercise    │  │  │
│  │ Docusaurus  │    │       │       │  Progress    │  │  │
│  │    Docs     │    │       ▼       └──────────────┘  │  │
│  └─────────────┘    │  ┌─────────┐                    │  │
│                     │  │  Kafka  │  (Dapr pub/sub)    │  │
│  ┌─────────────┐    │  └────┬────┘                    │  │
│  │ PostgreSQL  │◀───│       │                         │  │
│  │  (Bitnami)  │    │  Dapr State Store               │  │
│  └─────────────┘    └─────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 + Monaco | Student/Teacher UI + code editor |
| Backend | FastAPI + Dapr | 6 AI microservices |
| Messaging | Apache Kafka | Async pub/sub between agents |
| Database | PostgreSQL (Bitnami) | User data, mastery, submissions |
| State | Dapr State Store | Session state via PostgreSQL |
| Docs | Docusaurus | Auto-generated documentation |
| Orchestration | Kubernetes (Minikube) | Container management |

## Resource Budget (Minikube 3GB)

| Component | Requests | Limits |
|-----------|----------|--------|
| Kafka | 512Mi | 768Mi |
| PostgreSQL | 128Mi | 192Mi |
| Dapr system (3 pods) | 256Mi | 512Mi |
| 6 agents + sidecars | 576Mi | 1.15GB |
| Frontend | 128Mi | 256Mi |
| Docs | 64Mi | 128Mi |
| **Total** | **~1.66GB** | **~3.0GB** |

## Kafka Topics

| Topic | Producer | Consumer(s) |
|-------|----------|-------------|
| learning | Triage | Concepts |
| code | Triage | CodeReview, Debug |
| exercise | Triage | Exercise |
| struggle | Triage | Progress |
| responses | All specialists | Progress |
