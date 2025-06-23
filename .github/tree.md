├─app
│  │  layout.tsx
│  │  page.tsx
│  │
│  ├─account
│  │  │  page.tsx
│  │  │
│  │  └─notifications
│  │      │  page.tsx
│  │      │
│  │      └─components
│  │              NotificationBell.tsx
│  │
│  ├─dashboard
│  │  │  page.tsx
│  │  │
│  │  ├─components
│  │  │  ├─charts
│  │  │  │      EfficiencyBarChart.tsx
│  │  │  │      PersonnelPieChart.tsx
│  │  │  │      ProgressRadarChart.tsx
│  │  │  │      WorkforceLineChart.tsx
│  │  │  │
│  │  │  ├─layout
│  │  │  │      DashboardLayout.tsx
│  │  │  │      ProjectAnalysisCard.tsx
│  │  │  │      SidebarNav.tsx
│  │  │  │
│  │  │  ├─logs
│  │  │  │      ActivityLog.tsx
│  │  │  │      LogFilter.tsx
│  │  │  │
│  │  │  └─stats
│  │  │          StatCard.tsx
│  │  │          StatGrid.tsx
│  │  │
│  │  ├─hooks
│  │  │      useLogData.ts
│  │  │      useProjectData.ts
│  │  │
│  │  ├─types
│  │  │      dashboard.d.ts
│  │  │
│  │  └─utils
│  │          chartUtils.ts
│  │          logUtils.ts
│  │
│  ├─finance
│  │  │  layout.tsx
│  │  │
│  │  ├─archive
│  │  │  │  page.tsx
│  │  │  │
│  │  │  └─[type]
│  │  │          page.tsx
│  │  │
│  │  ├─components
│  │  │      FinanceListPage.tsx
│  │  │
│  │  └─[type]
│  │      │  page.tsx
│  │      │
│  │      ├─create
│  │      │      page.tsx
│  │      │
│  │      └─[id]
│  │              page.tsx
│  │
│  ├─gemini
│  │      page.tsx
│  │
│  ├─management
│  │  │  page.tsx
│  │  │
│  │  ├─components
│  │  │      RolePermissions.tsx
│  │  │      UserList.tsx
│  │  │
│  │  └─send-notification
│  │          page.tsx
│  │
│  ├─planning
│  │  ├─calendar
│  │  │      page.tsx
│  │  │
│  │  └─schedule
│  │          page.tsx
│  │
│  └─projects
│      │  layout.tsx
│      │  page.tsx
│      │
│      ├─components
│      │      AddressSelector.tsx
│      │      DataLoader.tsx
│      │      ProjectDashboard.tsx
│      │      ProjectsTable.tsx
│      │      WeatherDisplay.tsx
│      │
│      ├─hooks
│      │      useFilteredProjects.ts
│      │
│      ├─import
│      │      page.tsx
│      │
│      ├─templates
│      │      page.tsx
│      │
│      ├─types
│      │      project.d.ts
│      │
│      ├─utils
│      │      progressUtils.tsx
│      │      projectUtils.ts
│      │
│      └─[project]
│          │  page.tsx
│          │
│          ├─components
│          │      ProjectEditModal.tsx
│          │      ProjectInfoDisplay.tsx
│          │      ProjectInfoPage.tsx
│          │      WorkpackageList.tsx
│          │
│          ├─project-calendar
│          │      page.tsx
│          │
│          ├─project-expenses
│          │      page.tsx
│          │
│          ├─project-issues
│          │      page.tsx
│          │
│          ├─project-journal
│          │  │  page.tsx
│          │  │
│          │  └─components
│          │          JournalForm.tsx
│          │          JournalHistory.tsx
│          │
│          ├─project-materials
│          │      page.tsx
│          │
│          ├─project-storage
│          │      page.tsx
│          │
│          └─workpackages
│              └─[workpackage]
│                  │  page.tsx
│                  │
│                  └─subworkpackages
│                      └─[subworkpackage]
│                              page.tsx
│
├─components
│  ├─common
│  │      ArchiveNavGroup.tsx
│  │      DynamicNavGroup.tsx
│  │      ModeToggle.tsx
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
│  ├─tabs
│  │      BottomNavigation.tsx
│  │
│  └─ui
│          accordion.tsx
│          alert-dialog.tsx
│          alert.tsx
│          aspect-ratio.tsx
│          avatar.tsx
│          badge.tsx
│          breadcrumb.tsx
│          button.tsx
│          calendar.tsx
│          card.tsx
│          carousel.tsx
│          chart.tsx
│          checkbox.tsx
│          collapsible.tsx
│          command.tsx
│          dialog.tsx
│          drawer.tsx
│          dropdown-menu.tsx
│          hover-card.tsx
│          input.tsx
│          label.tsx
│          menubar.tsx
│          navigation-menu.tsx
│          pagination.tsx
│          popover.tsx
│          progress.tsx
│          radio-group.tsx
│          resizable.tsx
│          scroll-area.tsx
│          select.tsx
│          separator.tsx
│          sheet.tsx
│          sidebar.tsx
│          skeleton.tsx
│          slider.tsx
│          sonner.tsx
│          switch.tsx
│          table.tsx
│          tabs.tsx
│          textarea.tsx
│          toggle-group.tsx
│          toggle.tsx
│          tooltip.tsx
│
├─constants
│      navigation.tsx
│      permissions.ts
│      roles.ts
│
├─hooks
│      use-mobile.ts
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
│      utils.ts
│
├─providers
│      theme-provider.tsx
│
├─styles
│      globals.css
│      react-big-calendar.css
│
├─types
│      archive.d.ts
│      auth.d.ts
│      calendar.d.ts
│      codingStandards.d.ts
│      common.d.ts
│      finance.d.ts
│      googleMaps.d.ts
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