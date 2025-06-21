│  index.ts
│
├─components
│  │  index.ts
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
│  ├─dashboard
│  │      index.ts
│  │      ProjectDashboard.tsx
│  │      ProjectsTable.tsx
│  │      ProjectStats.tsx
│  │
│  ├─expenses
│  │      ExpenseForm.tsx
│  │      ExpenseList.tsx
│  │      index.ts
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
│  ├─subwork-packages
│  │      index.ts
│  │      SubWorkpackageCard.tsx
│  │      SubWorkpackageForm.tsx
│  │      SubWorkpackageList.tsx
│  │
│  ├─templates
│  │      index.ts
│  │      TemplateCard.tsx
│  │      TemplateForm.tsx
│  │
│  └─work-packages
│          index.ts
│          WorkpackageCard.tsx
│          WorkpackageForm.tsx
│          WorkpackageList.tsx
│
├─constants
│      index.ts
│      projectConstants.ts
│      statusConstants.ts
│      validationRules.ts
│
├─hooks
│      index.ts
│      useFilteredProjects.ts
│      useProjectActions.ts
│      useProjectErrorHandler.ts
│      useProjectForm.ts
│      useProjectState.ts
│
├─pages
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
│      ├─calendar
│      │      page.tsx
│      │
│      ├─expenses
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
│      ├─subwork-packages
│      │      page.tsx
│      │
│      └─work-packages
│              page.tsx
│
├─services
│      index.ts
│      issueService.ts
│      journalService.ts
│      projectService.ts
│      subworkpackageService.ts
│      templateService.ts
│      workpackageService.ts
│
├─styles
│      index.ts
│
├─types
│      project.d.ts
│
└─utils
        dateUtils.ts
        index.ts
        progressUtils.tsx
        projectUtils.ts
        qualityUtils.ts
        riskUtils.ts


@CalendarView.tsx @index.ts @AddressSelector.tsx @index.ts @DataLoader.tsx @LoadingSpinner.tsx @PageContainer.tsx @PageHeader.tsx @WeatherDisplay.tsx @index.ts @ProjectDashboard.tsx @ProjectsTable.tsx @ProjectStats.tsx @ExpenseForm.tsx @ExpenseList.tsx @index.ts @ProjectSetupForm.tsx @TemplateSelector.tsx @index.ts @ContractSelector.tsx @index.ts @IssueForm.tsx @IssueList.tsx @index.ts @JournalCard.tsx @JournalForm.tsx @JournalHistory.tsx @ChangeManager.tsx @index.ts @IssueTracker.tsx @MilestoneTracker.tsx @RiskManager.tsx @index.ts @MaterialForm.tsx @MaterialList.tsx @index.ts @ProjectEditModal.tsx @ProjectInfoDisplay.tsx @ProjectInfoPage.tsx @index.ts @SubWorkpackageCard.tsx @SubWorkpackageForm.tsx @SubWorkpackageList.tsx @index.ts @TemplateCard.tsx @TemplateForm.tsx @index.ts @WorkpackageCard.tsx @WorkpackageForm.tsx @WorkpackageList.tsx @index.ts @index.ts @projectConstants.ts @statusConstants.ts @validationRules.ts @index.ts @useFilteredProjects.ts @useProjectActions.ts @useProjectErrorHandler.ts @useProjectForm.ts @useProjectState.ts @page.tsx @page.tsx @page.tsx @page.tsx @page.tsx @page.tsx @page.tsx @page.tsx @page.tsx @page.tsx @index.ts @page.tsx @projectService.ts @issueService.ts @journalService.ts @subworkpackageService.ts @templateService.ts @workpackageService.ts @index.ts @project.d.ts @dateUtils.ts @index.ts @progressUtils.tsx @projectUtils.ts @index.ts @qualityUtils.ts @riskUtils.ts @/projects @/components @/calendar @/common @/dashboard @/expenses @/generate-from-contract @/issues @/journal @/management @/materials @/project @/subwork-packages @/templates @/work-packages @/constants @/hooks @/pages @/[project] @/calendar @/expenses @/issues @/journal @/materials @/subwork-packages @/work-packages @/generate-from-contract @/list @/templates @/services @/styles @/types @/utils @page.tsx
 
 如何在src\app\test\page.tsx顯示
 src\modules\projects\pages\[project]
src\modules\projects\pages\[project]\calendar
src\modules\projects\pages\[project]\calendar\page.tsx
src\modules\projects\pages\[project]\expenses
src\modules\projects\pages\[project]\expenses\page.tsx
src\modules\projects\pages\[project]\issues
src\modules\projects\pages\[project]\issues\page.tsx
src\modules\projects\pages\[project]\journal
src\modules\projects\pages\[project]\journal\page.tsx
src\modules\projects\pages\[project]\materials
src\modules\projects\pages\[project]\materials\page.tsx
src\modules\projects\pages\[project]\subwork-packages
src\modules\projects\pages\[project]\subwork-packages\page.tsx
src\modules\projects\pages\[project]\work-packages
src\modules\projects\pages\[project]\work-packages\page.tsx
src\modules\projects\pages\[project]\page.tsx
src\modules\projects\pages\generate-from-contract
src\modules\projects\pages\generate-from-contract\page.tsx
src\modules\projects\pages\list
src\modules\projects\pages\list\page.tsx
src\modules\projects\pages\templates
src\modules\projects\pages\templates\page.tsx