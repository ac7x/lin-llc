/**
 * 排程時間介面 - 定義專案或任務的時間規劃和執行時間
 */
export interface ScheduleTime {
  plannedStart?: string;    // 計畫起始時間 - 專案或任務的預期開始時間
  plannedEnd?: string;      // 計畫結束時間 - 專案或任務的預期完成時間
  scheduledStart?: string;  // 排定開始時間 - 經過資源規劃後的實際排程開始時間
  scheduledEnd?: string;    // 排定結束時間 - 經過資源規劃後的實際排程結束時間
  actualStart?: string;     // 實際開始時間 - 專案或任務實際開始執行的時間
  actualEnd?: string;       // 實際結束時間 - 專案或任務實際完成執行的時間
  createdAt?: string;       // 建立時間 - 此時間排程記錄的建立時間戳記
  updatedAt?: string;       // 更新時間 - 此時間排程記錄的最後修改時間戳記
}

/**
 * 任務包介面 - 代表專案中最小的任務單位
 */
export interface TaskPackage { 
  name: string;                    // 任務包名稱 - 任務的識別名稱
  time?: ScheduleTime;             // 時間排程 - 任務的時間規劃和實際執行時間
  assigness?: string[];            // 指派人員 - 負責執行此任務的人員清單
  completed: number;               // 已完成數量 - 已完成的工作項目數量
  total: number;                   // 總數量 - 此任務包含的總工作項目數量
  progress: number;                // 進度百分比 - 完成進度的百分比值 (0-100)
}

/**
 * 子工作包介面 - 代表工作包下的子分類，包含多個任務包
 */
export interface Subpackage { 
  name: string;                    // 子工作包名稱 - 子工作包的識別名稱
  time?: ScheduleTime;             // 時間排程 - 子工作包的時間規劃和實際執行時間
  assigness?: string[];            // 指派人員 - 負責此子工作包的人員清單
  taskpackages: TaskPackage[];     // 任務包清單 - 此子工作包包含的所有任務包
  completed: number;               // 已完成數量 - 已完成的工作項目總數量
  total: number;                   // 總數量 - 此子工作包包含的總工作項目數量
  progress: number;                // 進度百分比 - 完成進度的百分比值 (0-100)
}

/**
 * 工作包介面 - 代表專案中的主要工作分類，包含多個子工作包
 */
export interface Package { 
  name: string;                    // 工作包名稱 - 工作包的識別名稱
  time?: ScheduleTime;             // 時間排程 - 工作包的時間規劃和實際執行時間
  assigness?: string[];            // 指派人員 - 負責此工作包的人員清單
  subpackages: Subpackage[];       // 子工作包清單 - 此工作包包含的所有子工作包
  completed: number;               // 已完成數量 - 已完成的工作項目總數量
  total: number;                   // 總數量 - 此工作包包含的總工作項目數量
  progress: number;                // 進度百分比 - 完成進度的百分比值 (0-100)
}

/**
 * 專案介面 - 代表整個專案，包含多個工作包
 */
export interface Project {
  id: string;                      // 專案識別碼 - Firestore 文件唯一識別碼
  name: string;                    // 專案名稱 - 專案的識別名稱
  time?: ScheduleTime;             // 時間排程 - 專案的時間規劃和實際執行時間
  assigness?: string[];            // 指派人員 - 負責此專案的人員清單
  description: string;             // 專案描述 - 專案的詳細說明文字
  createdAt: string;               // 建立時間 - 專案建立的時間戳記
  packages: Package[];             // 工作包清單 - 此專案包含的所有工作包
  completed: number;               // 已完成數量 - 已完成的工作項目總數量
  total: number;                   // 總數量 - 此專案包含的總工作項目數量
  progress: number;                // 進度百分比 - 完成進度的百分比值 (0-100)
}

/**
 * 選中項目聯合型別 - 定義在樹狀結構中當前選中的項目類型
 * 可以是專案、工作包、子工作包、任務包，或無選中項目
 */
export type SelectedItem = 
  | { type: 'project'; projectId: string }                                                    // 選中專案 - 包含專案識別碼
  | { type: 'package'; projectId: string; packageIndex: number }                              // 選中工作包 - 包含專案識別碼和工作包索引
  | { type: 'subpackage'; projectId: string; packageIndex: number; subpackageIndex: number } // 選中子工作包 - 包含專案識別碼、工作包索引和子工作包索引
  | { type: 'task'; projectId: string; packageIndex: number; subpackageIndex: number; taskIndex: number } // 選中任務包 - 包含完整的層級索引路徑
  | null;                                                                                     // 無選中項目 - 表示當前沒有選中任何項目

/**
 * 樹狀組件共用屬性介面 - 定義所有樹狀組件共用的屬性
 */
export interface TreeComponentProps {
  selectedItem: SelectedItem;                                                                   // 當前選中項目 - 在樹狀結構中選中的具體項目
  onItemClick: (item: SelectedItem) => void;                                                    // 項目點擊回調 - 當用戶點擊任何項目時觸發
  loading: boolean;                                                                             // 載入狀態 - 表示是否正在執行異步操作
  isItemSelected: (item: SelectedItem) => boolean;                                              // 項目選中檢查函數 - 檢查指定項目是否被選中
}

/**
 * 專案樹狀組件屬性介面 - 定義專案樹狀結構組件所需的所有屬性
 */
export interface ProjectTreeProps extends TreeComponentProps {
  project: Project;                                                                             // 專案資料 - 要顯示的專案物件
  selectedProject: Project | null;                                                              // 當前選中專案 - 用於高亮顯示當前選中的專案
  onSelectProject: (project: Project) => void;                                                  // 專案選擇回調 - 當用戶選擇專案時觸發
  onAddPackage: (projectId: string, pkgName: string) => Promise<void>;                          // 新增工作包回調 - 新增工作包的異步函數
  onAddTaskPackage: (projectId: string, pkgIdx: number, subIdx: number, taskPackageName: string) => Promise<void>; // 新增任務包回調 - 新增任務包的異步函數
  onAddSubpackage: (projectId: string, pkgIdx: number, subName: string) => Promise<void>;       // 新增子工作包回調 - 新增子工作包的異步函數
  pkgInputs: Record<string, string>;                                                            // 工作包輸入狀態 - 儲存各專案工作包輸入框的值
  setPkgInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;                  // 工作包輸入狀態設定器 - 更新工作包輸入框的值
  taskPackageInputs: Record<string, Record<number, string>>;                                    // 任務包輸入狀態 - 儲存各專案各工作包任務包輸入框的值
  setTaskPackageInputs: React.Dispatch<React.SetStateAction<Record<string, Record<number, string>>>>; // 任務包輸入狀態設定器 - 更新任務包輸入框的值
  subInputs: Record<string, Record<number, Record<number, string>>>;                            // 子工作包輸入狀態 - 儲存各專案各工作包各子工作包輸入框的值
  setSubInputs: React.Dispatch<React.SetStateAction<Record<string, Record<number, Record<number, string>>>>>; // 子工作包輸入狀態設定器 - 更新子工作包輸入框的值
}

/**
 * 專案節點組件屬性介面 - 定義專案節點組件所需的屬性
 */
export interface ProjectNodeProps extends TreeComponentProps {
  project: Project;                                                                             // 專案資料 - 要顯示的專案物件
  selectedProject: Project | null;                                                              // 當前選中專案 - 用於高亮顯示當前選中的專案
  onSelectProject: (project: Project) => void;                                                  // 專案選擇回調 - 當用戶選擇專案時觸發
  onAddPackage: (projectId: string, pkgName: string) => Promise<void>;                          // 新增工作包回調 - 新增工作包的異步函數
  pkgInputs: Record<string, string>;                                                            // 工作包輸入狀態 - 儲存各專案工作包輸入框的值
  setPkgInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;                  // 工作包輸入狀態設定器 - 更新工作包輸入框的值
}

/**
 * 工作包節點組件屬性介面 - 定義工作包節點組件所需的屬性
 */
export interface ProjectPackageNodeProps extends TreeComponentProps {
  project: Project;                                                                             // 專案資料 - 要顯示的專案物件
  packageIndex: number;                                                                         // 工作包索引 - 當前工作包在專案中的索引位置
  onAddSubpackage: (projectId: string, pkgIdx: number, subName: string) => Promise<void>;       // 新增子工作包回調 - 新增子工作包的異步函數
  taskPackageInputs: Record<string, Record<number, string>>;                                    // 任務包輸入狀態 - 儲存各專案各工作包任務包輸入框的值
  setTaskPackageInputs: React.Dispatch<React.SetStateAction<Record<string, Record<number, string>>>>; // 任務包輸入狀態設定器 - 更新任務包輸入框的值
}

/**
 * 子工作包節點組件屬性介面 - 定義子工作包節點組件所需的屬性
 */
export interface ProjectSubpackageNodeProps extends TreeComponentProps {
  project: Project;                                                                             // 專案資料 - 要顯示的專案物件
  packageIndex: number;                                                                         // 工作包索引 - 當前工作包在專案中的索引位置
  subpackageIndex: number;                                                                      // 子工作包索引 - 當前子工作包在工作包中的索引位置
  onAddTaskPackage: (projectId: string, pkgIdx: number, subIdx: number, taskPackageName: string) => Promise<void>; // 新增任務包回調 - 新增任務包的異步函數
  subInputs: Record<string, Record<number, Record<number, string>>>;                            // 子工作包輸入狀態 - 儲存各專案各工作包各子工作包輸入框的值
  setSubInputs: React.Dispatch<React.SetStateAction<Record<string, Record<number, Record<number, string>>>>>; // 子工作包輸入狀態設定器 - 更新子工作包輸入框的值
}

/**
 * 任務節點組件屬性介面 - 定義任務節點組件所需的屬性
 */
export interface ProjectTaskNodeProps extends TreeComponentProps {
  project: Project;                                                                             // 專案資料 - 要顯示的專案物件
  packageIndex: number;                                                                         // 工作包索引 - 當前工作包在專案中的索引位置
  subpackageIndex: number;                                                                      // 子工作包索引 - 當前子工作包在工作包中的索引位置
  taskIndex: number;                                                                            // 任務索引 - 當前任務在子工作包中的索引位置
}
