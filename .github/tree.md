.
├── app
│   ├── archive
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── [type]
│   │       └── page.tsx
│   ├── calendar
│   │   └── page.tsx
│   ├── contracts
│   │   ├── [contract]
│   │   │   └── page.tsx
│   │   ├── create
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── dashboard
│   │   └── page.tsx
│   ├── gemini
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── notifications
│   │   ├── components
│   │   │   ├── NotificationBell.tsx
│   │   │   └── NotificationTestTool.tsx
│   │   └── page.tsx
│   ├── orders
│   │   ├── add
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── [order]
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── page.tsx
│   ├── profile
│   │   └── page.tsx
│   ├── projects
│   │   ├── import
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── [project]
│   │   │   ├── page.tsx
│   │   │   ├── project-calendar
│   │   │   │   └── page.tsx
│   │   │   ├── project-expenses
│   │   │   │   └── page.tsx
│   │   │   ├── project-issues
│   │   │   │   └── page.tsx
│   │   │   ├── project-journal
│   │   │   │   └── page.tsx
│   │   │   ├── project-materials
│   │   │   │   └── page.tsx
│   │   │   └── workpackages
│   │   │       ├── subworkpackages
│   │   │       │   └── page.tsx
│   │   │       └── [workpackage]
│   │   │           └── page.tsx
│   │   └── templates
│   │       └── page.tsx
│   ├── quotes
│   │   ├── add
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── [quote]
│   │       └── page.tsx
│   ├── schedule
│   │   └── page.tsx
│   ├── send-notification
│   │   └── page.tsx
│   ├── settings
│   │   └── page.tsx
│   └── users
│       └── page.tsx
├── components
│   ├── bottom
│   │   ├── owner-nav.tsx
│   │   └── owner-nav-wrapper.tsx
│   ├── layouts
│   │   └── PageLayout.tsx
│   ├── pdf
│   │   ├── ContractPdfDocument.tsx
│   │   ├── OrderPdfDocument.tsx
│   │   ├── pdfExport.ts
│   │   └── QuotePdfDocument.tsx
│   └── settings
│       └── PermissionCategory.tsx
├── constants
│   └── permissions.ts
├── hooks
│   ├── useAuth.ts
│   ├── useNotifications.ts
│   └── usePermissions.ts
├── lib
│   ├── firebase-client.ts
│   ├── firebase-config.ts
│   └── firebase-notifications.ts
├── styles
│   ├── globals.css
│   └── react-big-calendar.css
├── types
│   ├── charts.d.ts
│   ├── env.d.ts
│   ├── finance.d.ts
│   ├── permission.ts
│   ├── project.d.ts
│   ├── settings.d.ts
│   └── user.d.ts
└── utils
    ├── authUtils.ts
    ├── colorScales.ts
    ├── dateUtils.ts
    ├── progressUtils.tsx
    └── taiwan-city.enum.ts
