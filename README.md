# EstateOps Analytics: Enterprise Real Estate Cash Flow & Business Intelligence Engine with SMS/Email Automation

An enterprise-grade PropTech RevOps and Business Intelligence solution engineered to automate multi-unit property ledger consolidation, calculate dynamic late-payment penalties, visualize portfolio risk metrics, and dispatch event-driven transactional SMS/Email payment reminders.

---

> ⚠️ **Data Privacy Note**
> The dataset, financial records, and client information in this repository consist of synthetic mock data generated for testing and demonstration purposes. It does not represent live financial transactions or actual individuals.

---

## Key Features & Enterprise Capabilities

- **Automated Multi-Tenant Ledger Consolidation:** Dynamically parses individual unit buyer ledgers, computes running balances, tracks payment methods, and aggregates multi-tab data into a central master summary.

- **Dynamic Fine & Risk Engine:** Automatically calculates tier-based late payment penalties based on configurable grace periods, overdue days, and account statuses (`Regular`, `Overdue`, `Completed`).

- **Executive BI Dashboard:** Powers a top-level portfolio dashboard featuring visual KPI indicators for total portfolio valuation, collected revenue, outstanding dues, collection efficiency rates, and overdue risk distribution.
- **Event-Driven Multi-Channel Notification Engine:** Dispatches automated payment reminders and overdue alerts via native `MailApp` services and third-party RESTful SMS Gateways (Greenweb API).

- **Zero-Hardcoding Security Architecture:** Enforces strict secret isolation using Google Apps Script `PropertiesService` to store sensitive API credentials securely outside the source code.

- **Resilient Data Extraction:** Features targeted cell range mapping (`H2:L2` for Name, `H3:L3` for Phone, `H5:L5` for Email) complemented by a regex fallback search to parse irregular user-edited sheet layouts reliably.

---

## System Architecture

```text
┌────────────────────────────────────────────────────────┐
│             Individual Property Ledgers                │
│            (P6_3B, P6_4A, P7_5B, P7_7A...)             │
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

## Technical Stack & Engineering Patterns

- **Language & Runtime:** JavaScript (ES6+), Google Apps Script V8 Engine.

- **Software Design Patterns:** Service Class Pattern (`SmsService`), Modular Domain Separation (`Config.gs`, `SmsService.gs`, `NotificationService.gs`, `Code.gs`).

- **Security & Secret Management:** Google Apps Script `PropertiesService` (`GREENWEB_API_TOKEN`).

- **Performance Optimization:** $O(N)$ lookup maps (`buildClientContactMap`) to prevent redundant matrix cell evaluations across dynamic workbook tabs.

---

## Project Structure

```text
estateops-analytics-engine/
├── src/
│   ├── Code.gs                 # Financial aggregation engine & ledger calculation logic
│   ├── Config.gs               # Global configuration constants & environment keys
│   ├── SmsService.gs           # HTTP REST client wrapper for Greenweb SMS Gateway
│   └── NotificationService.gs  # Automated email and SMS notification dispatcher
├── .gitignore                  # Excludes clasp configs and temporary environment files
├── LICENSE                     # MIT License
└── README.md                   # Enterprise system documentation

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

1. **Financial Aggregation:** Select `updateClientPaymentSummary` from the function dropdown in the Apps Script editor and click **Run**. This compiles all property ledgers into the central `Client Payment Summary` sheet.

2. **Dispatch Notifications:** Select `processClientNotifications` and click **Run**. This scans overdue accounts, calculates dynamic penalties, and triggers automated SMS and email notifications.

---

## Author & License

- **Author:** Salmanur Rahman

- **License:** [MIT License](https://www.google.com/search?q=LICENSE)
