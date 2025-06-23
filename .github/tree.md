├─app
│  │  layout.tsx
│  │  page.tsx
│  │
│  ├─archive
│  │  │  layout.tsx
│  │  │  page.tsx
│  │  │
│  │  └─[type]
│  │          page.tsx
│  │
│  ├─calendar
│  │      layout.tsx
│  │      page.tsx
│  │
│  ├─contracts
│  │  │  layout.tsx
│  │  │  page.tsx
│  │  │
│  │  ├─create
│  │  │      page.tsx
│  │  │
│  │  └─[contract]
│  │          page.tsx
│  │
│  ├─dashboard
│  │      layout.tsx
│  │      page.tsx
│  │
│  ├─gemini
│  │      layout.tsx
│  │      page.tsx
│  │
│  ├─management
│  │  │  layout.tsx
│  │  │  page.tsx
│  │  │
│  │  └─components
│  │          RolePermissions.tsx
│  │          UserList.tsx
│  │
│  ├─notifications
│  │  │  layout.tsx
│  │  │  page.tsx
│  │  │
│  │  └─components
│  │          NotificationBell.tsx
│  │
│  ├─orders
│  │  │  layout.tsx
│  │  │  page.tsx
│  │  │
│  │  ├─add
│  │  │      page.tsx
│  │  │
│  │  └─[order]
│  │          page.tsx
│  │
│  ├─profile
│  │      layout.tsx
│  │      page.tsx
│  │
│  ├─projects
│  │  │  layout.tsx
│  │  │  page.tsx
│  │  │
│  │  ├─components
│  │  │  │  AddressSelector.tsx
│  │  │  │  DataLoader.tsx
│  │  │  │  ProjectDashboard.tsx
│  │  │  │  ProjectsTable.tsx
│  │  │  │  WeatherDisplay.tsx
│  │  │  │
│  │  │  └─layout
│  │  │          PageLayout.tsx
│  │  │
│  │  ├─hooks
│  │  │      useFilteredProjects.ts
│  │  │
│  │  ├─import
│  │  │      page.tsx
│  │  │
│  │  ├─templates
│  │  │      page.tsx
│  │  │
│  │  ├─types
│  │  │      project.d.ts
│  │  │
│  │  ├─utils
│  │  │      progressUtils.tsx
│  │  │      projectUtils.ts
│  │  │
│  │  └─[project]
│  │      │  page.tsx
│  │      │
│  │      ├─components
│  │      │      ProjectEditModal.tsx
│  │      │      ProjectInfoDisplay.tsx
│  │      │      ProjectInfoPage.tsx
│  │      │      WorkpackageList.tsx
│  │      │
│  │      ├─project-calendar
│  │      │      page.tsx
│  │      │
│  │      ├─project-expenses
│  │      │      page.tsx
│  │      │
│  │      ├─project-issues
│  │      │      page.tsx
│  │      │
│  │      ├─project-journal
│  │      │  │  page.tsx
│  │      │  │
│  │      │  └─components
│  │      │          JournalForm.tsx
│  │      │          JournalHistory.tsx
│  │      │
│  │      ├─project-materials
│  │      │      page.tsx
│  │      │
│  │      ├─project-storage
│  │      │      page.tsx
│  │      │
│  │      ├─subworkpackages
│  │      │      page.tsx
│  │      │
│  │      └─workpackages
│  │          └─[workpackage]
│  │                  page.tsx
│  │
│  ├─quotes
│  │  │  layout.tsx
│  │  │  page.tsx
│  │  │
│  │  ├─add
│  │  │      page.tsx
│  │  │
│  │  └─[quote]
│  │          page.tsx
│  │
│  ├─schedule
│  │      layout.tsx
│  │      page.tsx
│  │
│  ├─send-notification
│  │      layout.tsx
│  │      page.tsx
│  │
│  └─signin
│          page.tsx
│
├─components
│  ├─common
│  │      PermissionCheck.tsx
│  │      Tabs.tsx
│  │      Unauthorized.tsx
│  │      VisTimeline.tsx
│  │
│  ├─pdf
│  │      ContractPdfDocument.tsx
│  │      OrderPdfDocument.tsx
│  │      pdfUtils.ts
│  │      QuotePdfDocument.tsx
│  │
│  └─tabs
│          BottomNavigation.tsx
│
├─constants
│      navigation.tsx
│      permissions.ts
│      roles.ts
│
├─hooks
│      useAppCheck.ts
│      useAuth.ts
│      useFirebaseMessaging.ts
│      useNotifications.ts
│
├─lib
│      firebase-client.ts
│      firebase-config.ts
│      firebase-init.ts
│      firebase-notifications.ts
│
├─styles
│      globals.css
│      react-big-calendar.css
│
├─types
│      archive.d.ts
│      auth.d.ts
│      calendar.d.ts
│      coding-standards.d.ts
│      common.d.ts
│      finance.d.ts
│      google-maps.d.ts
│      navigation.d.ts
│      notification.d.ts
│      timeline.d.ts
│
└─utils
        calendarUtils.ts
        classNameUtils.ts
        codingStandards.ts
        colorUtils.ts
        dateUtils.ts
        errorUtils.ts
        taiwanCityUtils.ts
        timelineUtils.ts