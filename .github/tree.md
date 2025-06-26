│  layout.tsx
│  page.tsx
│
├─(admin)
├─(client)
├─(finance)
│      page.tsx
│
├─(owner)
├─(safety)
├─(shared)
├─(supervisor)
├─(user)
│  └─account
│      │  page.tsx
│      │
│      ├─notifications
│      │      page.tsx
│      │
│      ├─signin
│      │      page.tsx
│      │
│      └─task
│              page.tsx
│
├─(vendor)
├─dashboard
│      page.tsx
│
├─project
│  │  page.tsx
│  │
│  ├─components
│  │  ├─budget
│  │  │      index.ts
│  │  │      project-budget.tsx
│  │  │      types.ts
│  │  │
│  │  ├─calendar
│  │  │      index.ts
│  │  │      project-calendar.tsx
│  │  │
│  │  ├─create
│  │  │      create-project-wizard.tsx
│  │  │
│  │  ├─dialogs
│  │  │      quantity-distribution-dialog.tsx
│  │  │
│  │  ├─discussions
│  │  │      index.ts
│  │  │      project-discussions.tsx
│  │  │
│  │  ├─gemini
│  │  │      index.ts
│  │  │      project-ai-assistant.tsx
│  │  │
│  │  ├─issues
│  │  │      index.ts
│  │  │      project-issues.tsx
│  │  │      types.ts
│  │  │
│  │  ├─Journal
│  │  │      index.ts
│  │  │      project-journal.tsx
│  │  │      types.ts
│  │  │
│  │  ├─map
│  │  │      address-search.tsx
│  │  │      index.ts
│  │  │      map-service.ts
│  │  │      project-map.tsx
│  │  │      simple-project-map.tsx
│  │  │
│  │  ├─schedule
│  │  │      index.ts
│  │  │      project-schedule.tsx
│  │  │
│  │  ├─sidebar
│  │  │      project-sidebar.tsx
│  │  │      quantity-management-tab.tsx
│  │  │
│  │  ├─storage
│  │  │      index.ts
│  │  │      project-storage.tsx
│  │  │      types.ts
│  │  │
│  │  ├─task
│  │  │      index.ts
│  │  │      task-assignment-dialog.tsx
│  │  │      task-review-dialog.tsx
│  │  │      task-submission-dialog.tsx
│  │  │
│  │  ├─template
│  │  │      index.ts
│  │  │      project-templates.tsx
│  │  │
│  │  ├─tree
│  │  │      index.ts
│  │  │      project-node.tsx
│  │  │      project-package-node.tsx
│  │  │      project-subpackage-node.tsx
│  │  │      project-task-node.tsx
│  │  │      project-tree.tsx
│  │  │      rename-dialog.tsx
│  │  │      task-action-buttons.tsx
│  │  │      tree-utils.tsx
│  │  │      virtualized-tree-node.tsx
│  │  │
│  │  ├─ui
│  │  │      index.ts
│  │  │      points-dashboard.tsx
│  │  │      project-skeletons.tsx
│  │  │      region-selector.tsx
│  │  │      simple-context-menu.tsx
│  │  │      user-selector.tsx
│  │  │
│  │  ├─viewer
│  │  │      index.ts
│  │  │      package-details.tsx
│  │  │      project-details.tsx
│  │  │      project-edit-dialog.tsx
│  │  │      project-overview-cards.tsx
│  │  │      project-viewer.tsx
│  │  │      subpackage-details.tsx
│  │  │      task-details.tsx
│  │  │
│  │  └─weather
│  │          current-weather.tsx
│  │          index.ts
│  │          weather-forecast.tsx
│  │          weather-service.ts
│  │
│  ├─constants
│  │      index.ts
│  │
│  ├─hooks
│  │      index.ts
│  │      use-project-data.ts
│  │      use-project-operations.ts
│  │      use-project-progress.ts
│  │      use-project-selection.ts
│  │      use-project-wizard.ts
│  │      use-task-management.ts
│  │
│  ├─types
│  │      index.ts
│  │
│  └─utils
│          index.ts
│          notification-service.ts
│          points-system.ts
│          progress-calculator.ts
│          tree-flattener.ts
│
├─settings
│  │  page.tsx
│  │
│  ├─components
│  │      permission-guard.tsx
│  │
│  ├─hooks
│  │      use-permission-optimized.ts
│  │      use-permission.ts
│  │
│  ├─lib
│  │      env-config.ts
│  │      permission-init.ts
│  │      permission-service.ts
│  │
│  └─types
│          index.ts