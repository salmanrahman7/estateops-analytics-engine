# Real Estate Payment Automation & Financial Tracking System

An enterprise-grade Google Apps Script solution built for real estate property managers and developers to automate multi-unit installment tracking, calculate late payment fines, aggregate portfolio analytics, and dispatch transactional SMS and email notifications.

![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google&logoColor=white)
![JavaScript ES6](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![REST API](https://img.shields.io/badge/Greenweb_SMS_API-000000?style=for-the-badge)
![License MIT](https://img.shields.io/badge/License-MIT-green.style=for-the-badge)

---

> ⚠️ **Data Privacy Note**  
> The dataset and client records referenced in this repository consist of synthetic/dummy data created exclusively for testing and demonstration purposes. It does not represent real-world individuals, entities, or live financial transactions.

---

## Key Features

- **Automated Ledger Aggregation:** Parses individual property ledger sheets, computes running balances, total received amounts, and upcoming payment due dates across complex multi-tab workbooks.
- **Fine & Overdue Calculation Engine:** Automatically calculates tier-based late payment fines based on grace periods, days overdue, and account status (`Overdue`, `Regular`, `Completed`).
- **Multi-Channel Dispatcher:** Sends automated payment reminders via `MailApp` (Email) and integrates with the Greenweb Bangladesh REST API for real-time SMS delivery.
- **Enterprise Security (Zero Hardcoding):** Secures third-party API credentials using Google Apps Script `PropertiesService` isolation rather than exposing keys in source code.
- **Resilient Contact Matching:** Features targeted cell range parsing (`H2:L2` for Name, `H3:L3` for Phone, `H5:L5` for Email) alongside a regex fallback search to extract client metadata dynamically across irregular sheet layouts.

---

## System Architecture

```text
┌────────────────────────────────────────────────────────┐
│             Individual Property Ledgers                │
│            (P23_7B, P24_6A, P24_1A, ...)               │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
           ┌────────────────────────────────┐
           │ updateClientPaymentSummary()   │
           │       (Engine in Code.gs)      │
           └────────────────┬───────────────┘
                            │
                            ▼
           ┌────────────────────────────────┐
           │   Client Payment Summary Sheet │
           │     (Centralized Analytics)    │
           └────────────────┬───────────────┘
                            │
                            ▼
           ┌────────────────────────────────┐
           │ processClientNotifications()   │
           │    (NotificationService.gs)    │
           └────────┬───────────────┬───────┘
                    │               │
                    ▼               ▼
      ┌───────────────────┐   ┌────────────────────────┐
      │ MailApp Service   │   │   SmsService Class     │
      │ (Email Dispatch)  │   └───────────┬────────────┘
      └───────────────────┘               │
                                          ▼
                              ┌────────────────────────┐
                              │ Greenweb REST SMS API  │
                              └────────────────────────┘
```

---

## Technical Stack & Software Architecture

- **Language & Runtime:** JavaScript (ES6+), Google Apps Script V8 Engine.
- **Software Design Patterns:** Service Class Pattern (`SmsService`), Modular File Architecture (`Config.gs`, `SmsService.gs`, `NotificationService.gs`, `Code.gs`).
- **Security & Secret Management:** Google Apps Script `PropertiesService` (`GREENWEB_API_TOKEN`).
- **Algorithms:** Optimized $O(N)$ lookup maps (`buildClientContactMap`) to avoid redundant matrix cell reads across multi-sheet workbooks.

---

## Project Structure

```text
real-estate-payment-automation/
├── src/
│   ├── Code.gs                 # Financial engine & sheet aggregation logic
│   ├── Config.gs               # Global configuration constants & environment keys
│   ├── SmsService.gs           # Third-party HTTP REST client for Greenweb SMS Gateway
│   └── NotificationService.gs  # Automated email/SMS notification dispatcher
├── .gitignore                  # Git ignore rules for clasp and temporary files
├── LICENSE                     # MIT License
└── README.md                   # Project documentation

```

---

## Setup & Installation

### 1. Script Properties Setup (API Credentials)

1. Open your Google Sheet $\rightarrow$ **Extensions** $\rightarrow$ **Apps Script**.
2. Click the **Project Settings** icon (⚙️) on the left sidebar.
3. Scroll down to **Script Properties** and click **Add script property**.

- **Property:** `GREENWEB_API_TOKEN`
- **Value:** `YOUR_GREENWEB_API_KEY` _(Use demo token `1234567890123456789` for local testing)_

### 2. Standard Execution Workflow

To run the automated workflows from the Apps Script editor toolbar:

1. **Run Financial Aggregation:** Select `updateClientPaymentSummary` from the function dropdown and click **Run**. This compiles all property ledgers into the `Client Payment Summary` sheet.
2. **Dispatch Overdue Notifications:** Select `processClientNotifications` and click **Run**. This evaluates overdue client balances and sends transactional SMS and email reminders.

---

## Author & License

- **Author:** Salmanur Rahman
- **License:** [MIT License](https://www.google.com/search?q=LICENSE)
