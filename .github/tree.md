.
├── app
│   ├── layout.tsx
│   ├── owner
│   │   ├── archive
│   │   │   ├── contracts
│   │   │   │   └── page.tsx
│   │   │   ├── invoices
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── orders
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx
│   │   │   ├── projects
│   │   │   │   └── page.tsx
│   │   │   └── quotes
│   │   │       └── page.tsx
│   │   ├── calendar
│   │   │   └── page.tsx
│   │   ├── contracts
│   │   │   ├── [contract]
│   │   │   │   └── page.tsx
│   │   │   ├── create
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── dashboard
│   │   │   └── page.tsx
│   │   ├── gemini
│   │   │   └── page.tsx
│   │   ├── invoices
│   │   │   ├── create
│   │   │   │   └── page.tsx
│   │   │   ├── [invoice]
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── notifications
│   │   │   ├── components
│   │   │   │   ├── NotificationBell.tsx
│   │   │   │   └── NotificationTestTool.tsx
│   │   │   ├── firebase-notifications.ts
│   │   │   ├── hooks
│   │   │   │   └── useNotifications.ts
│   │   │   ├── page.tsx
│   │   │   └── test
│   │   │       └── page.tsx
│   │   ├── orders
│   │   │   ├── add
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── [order]
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   ├── profile
│   │   │   └── page.tsx
│   │   ├── projects
│   │   │   ├── import
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── [project]
│   │   │   │   ├── page.tsx
│   │   │   │   ├── project-calendar
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── project-issues
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── project-journal
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── project-materials
│   │   │   │   │   └── page.tsx
│   │   │   │   └── workpackages
│   │   │   │       ├── subworkpackages
│   │   │   │       │   └── page.tsx
│   │   │   │       └── [workpackage]
│   │   │   │           └── page.tsx
│   │   │   └── templates
│   │   │       └── page.tsx
│   │   ├── quotes
│   │   │   ├── add
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── [quote]
│   │   │       └── page.tsx
│   │   ├── schedule
│   │   │   └── page.tsx
│   │   ├── settings
│   │   │   └── page.tsx
│   │   └── users
│   │       └── page.tsx
│   ├── page.tsx
│   └── shared
│       └── signin
│           └── page.tsx
├── components
│   ├── bottom
│   │   ├── owner-nav.tsx
│   │   └── owner-nav-wrapper.tsx
│   ├── pdf
│   │   ├── ContractPdfDocument.tsx
│   │   ├── InvoicePdfDocument.tsx
│   │   ├── OrderPdfDocument.tsx
│   │   ├── pdfExport.ts
│   │   └── QuotePdfDocument.tsx
│   └── side
│       ├── archive-nav.tsx
│       ├── contract-nav.tsx
│       ├── invoice-nav.tsx
│       ├── order-nav.tsx
│       └── quote-nav.tsx
├── hooks
│   ├── useFirebase.ts
│   └── useUserRole.ts
├── lib
│   ├── firebase-client.ts
│   └── firebase-config.ts
├── styles
│   ├── globals.css
│   └── react-big-calendar.css
├── types
│   ├── charts.d.ts
│   ├── env.d.ts
│   ├── finance.d.ts
│   ├── project.d.ts
│   └── user.d.ts
└── utils
    ├── colorScales.ts
    ├── date-format.tsx
    ├── projectProgress.tsx
    ├── roleHierarchy.ts
    ├── taiwan-city.enum.ts
    └── workpackageProgressBar.tsx
