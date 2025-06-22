│  page.tsx
│
└─projects
    │  index.ts
    │
    ├─components
    │  │  index.ts
    │  │
    │  ├─admin
    │  ├─analytics
    │  ├─budget
    │  │      BudgetForm.tsx
    │  │      BudgetTracker.tsx
    │  │      CostAlert.tsx
    │  │      index.ts
    │  │
    │  ├─calendar
    │  │      CalendarView.tsx
    │  │      index.ts
    │  │
    │  ├─common
    │  │      AddressSelector.tsx
    │  │      DataLoader.tsx
    │  │      index.ts
    │  │      LoadingSpinner.tsx
    │  │      PageContainer.tsx
    │  │      PageHeader.tsx
    │  │      WeatherDisplay.tsx
    │  │
    │  ├─contracts
    │  ├─dashboard
    │  │      index.ts
    │  │      ProjectDashboard.tsx
    │  │      ProjectsTable.tsx
    │  │      ProjectStats.tsx
    │  │
    │  ├─document
    │  │      BlueprintViewer.tsx
    │  │      DocumentVersioning.tsx
    │  │      index.ts
    │  │
    │  ├─expenses
    │  │      ExpenseForm.tsx
    │  │      ExpenseList.tsx
    │  │      index.ts
    │  │
    │  ├─gemini
    │  │      index.ts
    │  │      ProjectAnalysisDisplay.tsx
    │  │      ProjectGeminiChat.tsx
    │  │
    │  ├─generate-from-contract
    │  │      ContractSelector.tsx
    │  │      index.ts
    │  │      ProjectSetupForm.tsx
    │  │      TemplateSelector.tsx
    │  │
    │  ├─issues
    │  │      index.ts
    │  │      IssueForm.tsx
    │  │      IssueList.tsx
    │  │
    │  ├─journal
    │  │      index.ts
    │  │      JournalCard.tsx
    │  │      JournalForm.tsx
    │  │      JournalHistory.tsx
    │  │
    │  ├─management
    │  │      ChangeManager.tsx
    │  │      index.ts
    │  │      IssueTracker.tsx
    │  │      MilestoneTracker.tsx
    │  │      RiskManager.tsx
    │  │
    │  ├─materials
    │  │      index.ts
    │  │      MaterialForm.tsx
    │  │      MaterialList.tsx
    │  │
    │  ├─project
    │  │      index.ts
    │  │      ProjectEditModal.tsx
    │  │      ProjectInfoDisplay.tsx
    │  │      ProjectInfoPage.tsx
    │  │
    │  ├─schedule
    │  │      GanttChart.tsx
    │  │      index.ts
    │  │      MilestoneMarker.tsx
    │  │      ScheduleForm.tsx
    │  │      ScheduleList.tsx
    │  │      TaskDependencyGraph.tsx
    │  │
    │  ├─subwork-packages
    │  │      index.ts
    │  │      SubWorkPackageCard.tsx
    │  │      SubWorkPackageForm.tsx
    │  │      SubWorkPackageList.tsx
    │  │
    │  ├─templates
    │  │      index.ts
    │  │      TemplateCard.tsx
    │  │      TemplateForm.tsx
    │  │
    │  └─work-packages
    │          index.ts
    │          WorkPackageCard.tsx
    │          WorkPackageForm.tsx
    │          WorkPackageList.tsx
    │
    ├─constants
    │      index.ts
    │      projectConstants.ts
    │      statusConstants.ts
    │      validationRules.ts
    │
    ├─features
    │  ├─admin
    │  │      page.tsx
    │  │
    │  ├─analytics
    │  │      page.tsx
    │  │
    │  ├─contracts
    │  │      page.tsx
    │  │
    │  ├─generate-from-contract
    │  │      page.tsx
    │  │
    │  ├─list
    │  │      page.tsx
    │  │
    │  ├─templates
    │  │      page.tsx
    │  │
    │  └─[project]
    │      │  page.tsx
    │      │
    │      ├─budget
    │      │      page.tsx
    │      │
    │      ├─calendar
    │      │      page.tsx
    │      │
    │      ├─document
    │      │      page.tsx
    │      │
    │      ├─expenses
    │      │      page.tsx
    │      │
    │      ├─gemini
    │      │      page.tsx
    │      │
    │      ├─issues
    │      │      page.tsx
    │      │
    │      ├─journal
    │      │      page.tsx
    │      │
    │      ├─materials
    │      │      page.tsx
    │      │
    │      ├─schedule
    │      │      page.tsx
    │      │
    │      ├─subwork-packages
    │      │      page.tsx
    │      │
    │      └─work-packages
    │              page.tsx
    │
    ├─hooks
    │      index.ts
    │      useFilteredProjects.ts
    │      useProjectActions.ts
    │      useProjectAdmin.ts
    │      useProjectAnalytics.ts
    │      useProjectBudget.ts
    │      useProjectCalendar.ts
    │      useProjectContracts.ts
    │      useProjectDocuments.ts
    │      useProjectErrorHandler.ts
    │      useProjectForm.ts
    │      useProjectGemini.ts
    │      useProjectSchedule.ts
    │      useProjectState.ts
    │
    ├─services
    │      adminService.ts
    │      analyticsService.ts
    │      budgetService.ts
    │      calendarService.ts
    │      contractService.ts
    │      documentService.ts
    │      geminiService.ts
    │      index.ts
    │      issueService.ts
    │      journalService.ts
    │      projectService.ts
    │      scheduleService.ts
    │      subWorkPackageService.ts
    │      templateService.ts
    │      workPackageService.ts
    │
    ├─styles
    │      index.ts
    │
    ├─types
    │      index.ts
    │
    └─utils
            adminUtils.ts
            analyticsUtils.ts
            calendarUtils.ts
            contractUtils.ts
            dateUtils.ts
            geminiUtils.ts
            index.ts
            progressUtils.tsx
            projectUtils.ts
            qualityUtils.ts
            riskUtils.ts
            scheduleUtils.ts