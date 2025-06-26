│  .cursorignore
│  .cursorrules
│  .env
│  .eslintcache
│  .firebaserc
│  .gitignore
│  .nvmrc
│  .prettierignore
│  .prettierrc
│  apphosting.yaml
│  components.json
│  eslint.config.mjs
│  firebase.json
│  firestore.rules
│  next-env.d.ts
│  next.config.ts
│  package-lock.json
│  package.json
│  postcss.config.mjs
│  storage.rules
│  tsconfig.json
│  tsconfig.tsbuildinfo
│
├─.cursor
│      environment.json
│
├─.github
│  │  .copilot-codeGeneration-instructions.md
│  │  .copilot-commit-message-instructions.md
│  │  .copilot-pull-request-description-instructions.md
│  │  .copilot-review-instructions.md
│  │  codegen.md
│  │  tree.md
│  │
│  └─workflows
│          sync-or-pr.yml
│
├─public
│  │  firebase-messaging-sw.js
│  │  sup.svg
│  │
│  └─fonts
│          NotoSerifTC-Regular.ttf
│
├─script
│      debug.sh
│      install.sh
│      reset.sh
│      script.sh
│      uninstall.sh
│
└─src
    ├─app
    │  │  layout.tsx
    │  │  page.tsx
    │  │
    │  ├─dashboard
    │  │      page.tsx
    │  │
    │  ├─project
    │  │  │  page.tsx
    │  │  │
    │  │  ├─components
    │  │  │  │  create-project-wizard.tsx
    │  │  │  │  performance-comparison.tsx
    │  │  │  │  quantity-management-view.tsx
    │  │  │  │  virtualized-project-sidebar.tsx
    │  │  │  │
    │  │  │  ├─budget
    │  │  │  │      index.ts
    │  │  │  │      project-budget.tsx
    │  │  │  │      types.ts
    │  │  │  │
    │  │  │  ├─calendar
    │  │  │  │      index.ts
    │  │  │  │      project-calendar.tsx
    │  │  │  │
    │  │  │  ├─dialogs
    │  │  │  │      quantity-distribution-dialog.tsx
    │  │  │  │
    │  │  │  ├─discussions
    │  │  │  │      index.ts
    │  │  │  │      project-discussions.tsx
    │  │  │  │
    │  │  │  ├─gemini
    │  │  │  │      index.ts
    │  │  │  │      project-ai-assistant.tsx
    │  │  │  │
    │  │  │  ├─issues
    │  │  │  │      index.ts
    │  │  │  │      project-issues.tsx
    │  │  │  │      types.ts
    │  │  │  │
    │  │  │  ├─journal
    │  │  │  │      index.ts
    │  │  │  │      project-journal.tsx
    │  │  │  │      types.ts
    │  │  │  │
    │  │  │  ├─schedule
    │  │  │  │      index.ts
    │  │  │  │      project-schedule.tsx
    │  │  │  │
    │  │  │  ├─sidebar
    │  │  │  │      project-sidebar.tsx
    │  │  │  │      quantity-management-tab.tsx
    │  │  │  │
    │  │  │  ├─storage
    │  │  │  │      index.ts
    │  │  │  │      project-storage.tsx
    │  │  │  │      types.ts
    │  │  │  │
    │  │  │  ├─task
    │  │  │  │      index.ts
    │  │  │  │      task-assignment-dialog.tsx
    │  │  │  │      task-review-dialog.tsx
    │  │  │  │      task-submission-dialog.tsx
    │  │  │  │
    │  │  │  ├─template
    │  │  │  │      index.ts
    │  │  │  │
    │  │  │  ├─tree
    │  │  │  │      index.ts
    │  │  │  │      project-node.tsx
    │  │  │  │      project-package-node.tsx
    │  │  │  │      project-subpackage-node.tsx
    │  │  │  │      project-task-node.tsx
    │  │  │  │      project-tree.tsx
    │  │  │  │      virtualized-project-tree.tsx
    │  │  │  │      virtualized-tree-node.tsx
    │  │  │  │
    │  │  │  ├─ui
    │  │  │  │      index.ts
    │  │  │  │      points-dashboard.tsx
    │  │  │  │      project-skeletons.tsx
    │  │  │  │      simple-context-menu.tsx
    │  │  │  │      user-selector.tsx
    │  │  │  │
    │  │  │  └─viewer
    │  │  │          index.ts
    │  │  │          package-details.tsx
    │  │  │          project-details.tsx
    │  │  │          project-overview-cards.tsx
    │  │  │          project-viewer.tsx
    │  │  │          subpackage-details.tsx
    │  │  │          task-details.tsx
    │  │  │
    │  │  ├─constants
    │  │  │      index.ts
    │  │  │
    │  │  ├─hooks
    │  │  │      index.ts
    │  │  │      use-project-data.ts
    │  │  │      use-project-operations.ts
    │  │  │      use-project-progress.ts
    │  │  │      use-project-selection.ts
    │  │  │      use-project-wizard.ts
    │  │  │      use-task-management.ts
    │  │  │
    │  │  ├─types
    │  │  │      index.ts
    │  │  │
    │  │  └─utils
    │  │          index.ts
    │  │          notification-service.ts
    │  │          points-system.ts
    │  │          progress-calculator.ts
    │  │          tree-flattener.ts
    │  │
    │  ├─settings
    │  │  │  page.tsx
    │  │  │
    │  │  ├─components
    │  │  │      permission-guard.tsx
    │  │  │
    │  │  ├─hooks
    │  │  │      use-permission.ts
    │  │  │
    │  │  ├─lib
    │  │  │      env-config.ts
    │  │  │      permission-init.ts
    │  │  │      permission-service.ts
    │  │  │
    │  │  └─types
    │  │          index.ts
    │  │
    │  └─user
    │      └─account
    │          │  page.tsx
    │          │
    │          ├─notifications
    │          │      page.tsx
    │          │
    │          ├─signin
    │          │      page.tsx
    │          │
    │          └─task
    │                  page.tsx
    │
    ├─components
    │  └─ui
    │          accordion.tsx
    │          alert-dialog.tsx
    │          alert.tsx
    │          aspect-ratio.tsx
    │          avatar.tsx
    │          badge.tsx
    │          bottom-navigation.tsx
    │          breadcrumb.tsx
    │          button.tsx
    │          calendar.tsx
    │          card.tsx
    │          carousel.tsx
    │          chart.tsx
    │          checkbox.tsx
    │          collapsible.tsx
    │          command.tsx
    │          context-menu.tsx
    │          dialog.tsx
    │          drawer.tsx
    │          dropdown-menu.tsx
    │          form.tsx
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
    │          skill-tags-input.tsx
    │          slider.tsx
    │          sonner.tsx
    │          switch.tsx
    │          table.tsx
    │          tabs.tsx
    │          textarea.tsx
    │          theme-provider.tsx
    │          toggle-group.tsx
    │          toggle.tsx
    │          tooltip.tsx
    │
    ├─context
    │      auth-context.tsx
    │
    ├─hooks
    │      use-auth-redirect.ts
    │      use-google-auth.ts
    │      use-mobile.ts
    │
    ├─lib
    │      firebase-config.ts
    │      firebase-init.ts
    │      utils.ts
    │
    ├─styles
    │      globals.css
    │
    └─types
            index.ts