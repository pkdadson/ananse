/** User-facing strings for OrgChart chrome (toolbar, search, inspector, dialogs). */
export type AnanseOrgLabels = {
  searchAriaLabel: string;
  searchPlaceholder: string;
  clearSearch: string;
  matchSingular: string;
  matchPlural: string;
  undo: string;
  redo: string;
  addVacant: string;
  remove: string;
  exportJson: string;
  applyChanges: string;
  closeInspector: string;
  person: string;
  vacantRole: string;
  inspectorPerson: string;
  inspectorVacant: string;
  addVacantDialogTitle: string;
  addVacantDialogDescription: string;
  vacantTitleLabel: string;
  vacantTitlePlaceholder: string;
  cancel: string;
  addRole: string;
  name: string;
  title: string;
  email: string;
  location: string;
  department: string;
  tenureYears: string;
  employmentType: string;
  workMode: string;
  missingData: string;
  /** Collapse control: "1 report" / "2 reports" (people) or "1 child" / "2 children". */
  reportSingular: string;
  reportPlural: string;
  hideReports: string;
  showReports: string;
};

/** HR / people org chart (default). */
export const DEFAULT_ORG_LABELS: AnanseOrgLabels = {
  searchAriaLabel: "Search org chart",
  searchPlaceholder: "Search people...",
  clearSearch: "Clear search",
  matchSingular: "match",
  matchPlural: "matches",
  undo: "Undo",
  redo: "Redo",
  addVacant: "+ Vacant role",
  remove: "Remove",
  exportJson: "Export JSON",
  applyChanges: "Apply changes",
  closeInspector: "Close inspector",
  person: "Person",
  vacantRole: "Vacant role",
  inspectorPerson: "Person inspector",
  inspectorVacant: "Vacant role inspector",
  addVacantDialogTitle: "Add vacant role",
  addVacantDialogDescription:
    "Name the open position. It will be placed under the selected person (or the root).",
  vacantTitleLabel: "Title",
  vacantTitlePlaceholder: "e.g. Head of Growth",
  cancel: "Cancel",
  addRole: "Add role",
  name: "Name",
  title: "Title",
  email: "Email",
  location: "Location",
  department: "Department",
  tenureYears: "Tenure (years)",
  employmentType: "Employment type",
  workMode: "Work mode",
  missingData: "[OrgChart] Pass data={employees} or defaultData={employees}.",
  reportSingular: "report",
  reportPlural: "reports",
  hideReports: "Hide",
  showReports: "Show",
};

/**
 * Domain-neutral hierarchy (accounts, products, geo, ownership trees).
 * Use with `domain="hierarchy"` or merge into `labels`.
 */
export const DEFAULT_HIERARCHY_LABELS: AnanseOrgLabels = {
  ...DEFAULT_ORG_LABELS,
  searchAriaLabel: "Search hierarchy",
  searchPlaceholder: "Search nodes...",
  addVacant: "+ Child node",
  person: "Node",
  vacantRole: "Placeholder",
  inspectorPerson: "Node inspector",
  inspectorVacant: "Placeholder inspector",
  addVacantDialogTitle: "Add child node",
  addVacantDialogDescription:
    "Name the new node. It will be placed under the selected parent (or the root).",
  vacantTitleLabel: "Label",
  vacantTitlePlaceholder: "e.g. New region",
  addRole: "Add node",
  name: "Name",
  title: "Type / subtitle",
  department: "Group",
  location: "Region",
  missingData: "[OrgChart] Pass data={nodes} or defaultData={nodes}.",
  reportSingular: "child",
  reportPlural: "children",
};

/** Hide people-only card fields for non-HR hierarchies. */
export const HIERARCHY_CARD_FIELDS = {
  email: false,
  badges: false,
  location: true,
  department: true,
  photo: true,
} as const;

export function mergeOrgLabels(partial?: Partial<AnanseOrgLabels>): AnanseOrgLabels {
  return partial ? { ...DEFAULT_ORG_LABELS, ...partial } : DEFAULT_ORG_LABELS;
}

export function mergeHierarchyLabels(partial?: Partial<AnanseOrgLabels>): AnanseOrgLabels {
  return partial ? { ...DEFAULT_HIERARCHY_LABELS, ...partial } : DEFAULT_HIERARCHY_LABELS;
}

/** Shared strings for MindMap / FlowBuilder chrome. */
export type AnanseChartLabels = {
  searchAriaLabel: string;
  searchPlaceholder: string;
  clearSearch: string;
  matchSingular: string;
  matchPlural: string;
  exportJson: string;
  legendAriaLabel: string;
  legendStart: string;
  legendTask: string;
  legendDecision: string;
  legendEnd: string;
};

export const DEFAULT_CHART_LABELS: AnanseChartLabels = {
  searchAriaLabel: "Search",
  searchPlaceholder: "Search...",
  clearSearch: "Clear search",
  matchSingular: "match",
  matchPlural: "matches",
  exportJson: "Export JSON",
  legendAriaLabel: "Flow node legend",
  legendStart: "Start",
  legendTask: "Task",
  legendDecision: "Decision",
  legendEnd: "End",
};

export function mergeChartLabels(partial?: Partial<AnanseChartLabels>): AnanseChartLabels {
  return partial ? { ...DEFAULT_CHART_LABELS, ...partial } : DEFAULT_CHART_LABELS;
}
