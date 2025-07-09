# Gig Worker Finder – Feature Overview

Below is a concise catalogue of every major feature currently implemented in the project, grouped by area.

## 1. Authentication & Authorization  
_Models:_ **User**
* **JWT-based Auth** – Secure login / protected routes using JSON Web Tokens stored in `localStorage`.
* **Role System** – Users flagged as `worker`, `employer`, or `admin`; server-side middleware enforces role based access.
* **Admin Secret** – Admin accounts can only be created through `/api/auth/register-admin` when the correct `ADMIN_SECRET` is supplied.
* **Email & Phone Verification**
  * Users receive 6-digit OTP codes for each channel.
  * UI modals persist across tab changes until code is entered.
  * Verification flags automatically reset if the email/phone is changed.
* **Self-Service Account Deletion** – Users can delete their own account after typing a hard-coded confirmation phrase.

## 2. User Profile  
_Models:_ **User**
* **Rich Profile Page** – Edit username, name, contact info, country & currency.
* **Avatar Management** – Upload custom image or pick from 70 template avatars.
* **Theme Toggle** – Light / Dark switch stored per user in `localStorage`.
* **Language Toggle (i18n)** – English ▸ Sinhala instant UI swap.

## 3. Jobs Module  
_Models:_ **Job**, **User**
* **Employers**
  * Post new jobs, manage their own listings.
* **Workers**
  * Browse jobs, apply/un-apply.
  * Infinite scroll with Intersection Observer – seamless loading, replaces pagination.
  * Advanced sorting: latest/oldest, pay high/low, Title A→Z/Z→A, Employer A→Z/Z→A.
  * Bulk actions toolbar (apply, bookmark, hide) with multi-select checkboxes.
* **Real-time Updates** – Socket.io pushes new/edited jobs matching active filters; `jobRemoved` event prunes filled/removed posts instantly.
  * Quick messaging to employers from job card.
* **Dashboard**
  * Worker view – list of applied jobs.
  * Employer view – list of posted jobs.

## 4. Real-Time Chat  
_Models:_ **Message**, **User**, **Job (optional reference)**
* **Socket.IO Integration** – JWT-authenticated WebSocket channel.
* **1-to-1 Messaging** – `POST /api/chat` stores and instantly broadcasts messages.
* **Typing Indicators** – Shows “user is typing…” in real time.
* **Conversation List** – Sidebar sorted by unread first, then most recent, with unread badge.
* **Native Notifications** – Browser push notifications (and toast) for new incoming messages when unfocused.
* **Auto-Scroll & Duplicate Guard** – View jumps to newest message; sent/received messages never duplicate.

## 5. Admin Panel  
_Models:_ **User**
* **Admin Dashboard** – List all users with delete button.
* **Self-Deletion Warning** – "Delete My Account" prompt; others require typing **OkAy**.
* **Automatic ‘(me)’ Tag** – Dashboard marks the logged-in admin in the table.

## 6. Modal & General UX
* **Flicker-free Modal** – Rendered via React Portal with body-scroll lock.
* **Morphing Modal Entrance** – modal animates from the clicked button’s position to center using anime.js for a polished “grow” effect.
* **Global Button Ripple** – touch/click ripple powered by anime.js; spans are attached to `document.body` so they survive React re-renders.
* **Job Card Animations** – smooth entrance cascade, subtle hover lift, and scroll-reveal as cards enter viewport.
* **Dark-Mode Polish** – additional CSS overrides ensure badges, tables, muted text, dropdowns, etc. remain legible in dark theme.
* Accessibility tweaks: auto-focus management, compact-view toggle.

## 7. Confirmation & Safety UX
* Context-aware dialog/prompt combinations to avoid accidental destructive actions.

## 8. Backend Architecture
* **Express + MongoDB (Mongoose)** – REST API with modular controllers/routes.
* **Socket.IO Server** – Same Node process; auto-joins user room from JWT.
* **Pre-Save & pre-Update Hooks** – Maintain verification state integrity.
* **TTL Index** – Unverified accounts can auto-expire (configurable).

## 9. Front-End Stack
* React 18 + React Router 6
* Bootstrap 5 for responsive design
* React-Toastify notifications
* axios wrapper `src/api.js` for all HTTP calls

## 11. External APIs & Providers
| Provider | Used For |
|----------|----------|
| Nodemailer (SMTP) / Ethereal | Transactional and test emails |
| Infobip / Vonage / Twilio | Multi-provider SMS OTP delivery |
| Socket.io | Real-time chat & live job updates |
| ExchangeRate-API | Currency conversion rates |
| React-Toastify | In-app toast notifications |
| Bootstrap 5 CDN | CSS framework |

## 10. Deployment Readiness
* `.env` driven configuration (`MONGO_URI`, `JWT_SECRET`, `ADMIN_SECRET`, etc.).
* CORS enabled; static uploads served from `/uploads`.

---
This document should help new developers, testers, or stakeholders quickly understand what the application offers right now. Update it whenever a new feature ships!
