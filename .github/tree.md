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
│  │  │  ├─Journal
│  │  │  │      page.tsx
│  │  │  │
│  │  │  ├─storage
│  │  │  │      page.tsx
│  │  │  │
│  │  │  └─template
│  │  │          page.tsx
│  │  │
│  │  └─[projectId]
│  │      │  page.tsx
│  │      │
│  │      └─package
│  │          └─[packageId]
│  │              │  page.tsx
│  │              │
│  │              └─subpackage
│  │                  └─[subpackageId]
│  │                      │  page.tsx
│  │                      │
│  │                      └─taskpackage
│  │                          └─[taskpackageId]
│  │                                  page.tsx
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
│  │  ├─service
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
│  │  app-sidebar.tsx
│  │  page.tsx
│  │
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