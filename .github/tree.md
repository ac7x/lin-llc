.
├── apphosting.yaml
├── eslint.config.mjs
├── firebase.json
├── firestore.rules
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── public
│   ├── firebase-messaging-sw.js
│   ├── fonts
│   │   └── NotoSerifTC-Regular.ttf
│   └── sup.svg
├── script
│   ├── debug.sh
│   ├── install.sh
│   ├── reset.sh
│   ├── script.sh
│   └── uninstall.sh
├── src
│   ├── app
│   │   ├── archive
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── [type]
│   │   │       └── page.tsx
│   │   ├── calendar
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── contracts
│   │   │   ├── [contract]
│   │   │   │   └── page.tsx
│   │   │   ├── create
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── dashboard
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── gemini
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── management
│   │   │   ├── components
│   │   │   │   └── RolePermissions.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── notifications
│   │   │   ├── components
│   │   │   │   └── NotificationBell.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── orders
│   │   │   ├── add
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── [order]
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── profile
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── projects
│   │   │   ├── import
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── PageLayout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── [project]
│   │   │   │   ├── components
│   │   │   │   │   ├── ProjectEditModal.tsx
│   │   │   │   │   ├── ProjectInfoDisplay.tsx
│   │   │   │   │   ├── ProjectInfoPage.tsx
│   │   │   │   │   └── WorkpackageList.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── project-calendar
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── project-expenses
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── project-issues
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── project-journal
│   │   │   │   │   ├── components
│   │   │   │   │   │   └── WeatherDisplay.tsx
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
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── send-notification
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── signin
│   │       └── page.tsx
│   ├── components
│   │   ├── common
│   │   │   ├── AddressSelector.tsx
│   │   │   ├── PermissionCheck.tsx
│   │   │   └── Unauthorized.tsx
│   │   ├── pdf
│   │   │   ├── ContractPdfDocument.tsx
│   │   │   ├── OrderPdfDocument.tsx
│   │   │   ├── pdfExport.ts
│   │   │   └── QuotePdfDocument.tsx
│   │   └── tabs
│   │       └── BottomNavigation.tsx
│   ├── constants
│   │   └── roles.ts
│   ├── hooks
│   │   ├── useAuth.ts
│   │   ├── useFirebaseMessaging.ts
│   │   └── useNotifications.ts
│   ├── lib
│   │   ├── firebase-client.ts
│   │   ├── firebase-config.ts
│   │   └── firebase-notifications.ts
│   ├── styles
│   │   ├── globals.css
│   │   └── react-big-calendar.css
│   ├── types
│   │   ├── auth.d.ts
│   │   ├── common.d.ts
│   │   ├── finance.d.ts
│   │   ├── google-maps.d.ts
│   │   ├── notification.d.ts
│   │   └── project.d.ts
│   └── utils
│       ├── colorUtils.ts
│       ├── dateUtils.ts
│       ├── progressUtils.tsx
│       └── taiwanCityUtils.ts
├── storage.rules
├── tsconfig.json
└── tsconfig.tsbuildinfo
