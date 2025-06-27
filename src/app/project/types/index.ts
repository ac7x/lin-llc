/**
 * 台灣縣市枚舉
 */
export enum TaiwanCity {
  TaipeiCity = '台北市',
  NewTaipeiCity = '新北市',
  TaoyuanCity = '桃園市',
  TaichungCity = '台中市',
  TainanCity = '台南市',
  KaohsiungCity = '高雄市',
  KeelungCity = '基隆市',
  HsinchuCity = '新竹市',
  HsinchuCounty = '新竹縣',
  MiaoliCounty = '苗栗縣',
  ChanghuaCounty = '彰化縣',
  NantouCounty = '南投縣',
  YunlinCounty = '雲林縣',
  ChiayiCity = '嘉義市',
  ChiayiCounty = '嘉義縣',
  PingtungCounty = '屏東縣',
  YilanCounty = '宜蘭縣',
  HualienCounty = '花蓮縣',
  TaitungCounty = '台東縣',
  PenghuCounty = '澎湖縣',
  KinmenCounty = '金門縣',
  LienchiangCounty = '連江縣',
}

/**
 * 台灣縣市資訊介面
 */
export interface TaiwanCityInfo {
  value: TaiwanCity;
  label: string;
  owmQuery: string; // OpenWeatherMap API 查詢用字串
}

/**
 * 台灣縣市列表，包含 OpenWeatherMap API 查詢字串
 */
export const TaiwanCityList: TaiwanCityInfo[] = [
  {
    value: TaiwanCity.TaipeiCity,
    label: '台北市',
    owmQuery: 'Taipei,tw',
  },
  {
    value: TaiwanCity.NewTaipeiCity,
    label: '新北市',
    owmQuery: 'New Taipei,tw',
  },
  {
    value: TaiwanCity.TaoyuanCity,
    label: '桃園市',
    owmQuery: 'Taoyuan,tw',
  },
  {
    value: TaiwanCity.TaichungCity,
    label: '台中市',
    owmQuery: 'Taichung,tw',
  },
  {
    value: TaiwanCity.TainanCity,
    label: '台南市',
    owmQuery: 'Tainan,tw',
  },
  {
    value: TaiwanCity.KaohsiungCity,
    label: '高雄市',
    owmQuery: 'Kaohsiung,tw',
  },
  {
    value: TaiwanCity.KeelungCity,
    label: '基隆市',
    owmQuery: 'Keelung,tw',
  },
  {
    value: TaiwanCity.HsinchuCity,
    label: '新竹市',
    owmQuery: 'Hsinchu,tw',
  },
  {
    value: TaiwanCity.HsinchuCounty,
    label: '新竹縣',
    owmQuery: 'Hsinchu County,tw',
  },
  {
    value: TaiwanCity.MiaoliCounty,
    label: '苗栗縣',
    owmQuery: 'Miaoli,tw',
  },
  {
    value: TaiwanCity.ChanghuaCounty,
    label: '彰化縣',
    owmQuery: 'Changhua,tw',
  },
  {
    value: TaiwanCity.NantouCounty,
    label: '南投縣',
    owmQuery: 'Nantou,tw',
  },
  {
    value: TaiwanCity.YunlinCounty,
    label: '雲林縣',
    owmQuery: 'Yunlin,tw',
  },
  {
    value: TaiwanCity.ChiayiCity,
    label: '嘉義市',
    owmQuery: 'Chiayi,tw',
  },
  {
    value: TaiwanCity.ChiayiCounty,
    label: '嘉義縣',
    owmQuery: 'Chiayi County,tw',
  },
  {
    value: TaiwanCity.PingtungCounty,
    label: '屏東縣',
    owmQuery: 'Pingtung,tw',
  },
  {
    value: TaiwanCity.YilanCounty,
    label: '宜蘭縣',
    owmQuery: 'Yilan,tw',
  },
  {
    value: TaiwanCity.HualienCounty,
    label: '花蓮縣',
    owmQuery: 'Hualien,tw',
  },
  {
    value: TaiwanCity.TaitungCounty,
    label: '台東縣',
    owmQuery: 'Taitung,tw',
  },
  {
    value: TaiwanCity.PenghuCounty,
    label: '澎湖縣',
    owmQuery: 'Penghu,tw',
  },
  {
    value: TaiwanCity.KinmenCounty,
    label: '金門縣',
    owmQuery: 'Kinmen,tw',
  },
  {
    value: TaiwanCity.LienchiangCounty,
    label: '連江縣',
    owmQuery: 'Lienchiang,tw',
  },
];

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
  submitters?: string[];           // 提交者 - 此任務包的提交者（用戶 UID 陣列）
  reviewers?: string[];            // 審核者 - 此任務包的審核者（用戶 UID 陣列）
  completed: number;               // 已完成數量 - 已完成的工作項目數量
  total: number;                   // 總數量 - 此任務包含的總工作項目數量
  progress: number;                // 進度百分比 - 完成進度的百分比值 (0-100)
  status?: 'draft' | 'in-progress' | 'submitted' | 'approved' | 'rejected'; // 狀態 - 任務包當前狀態
  submittedAt?: string;            // 提交時間 - 任務包提交的時間戳記
  approvedAt?: string;             // 核准時間 - 任務包核准的時間戳記
  submittedBy?: string;            // 提交者 UID - 提交此任務包的用戶
  approvedBy?: string;             // 核准者 UID - 核准此任務包的用戶
}

/**
 * 子工作包介面 - 代表工作包下的子分類，包含多個任務包
 */
export interface SubPackage { 
  name: string;                    // 子工作包名稱 - 子工作包的識別名稱
  time?: ScheduleTime;             // 時間排程 - 子工作包的時間規劃和實際執行時間
  assigness?: string[];            // 指派人員 - 負責此子工作包的人員清單
  reviewers?: string[];            // 審核者 - 此子工作包的審核者（用戶 UID 陣列）
  submitters?: string[];           // 提交者 - 此子工作包的提交者（用戶 UID 陣列）
  taskpackages: TaskPackage[];     // 任務包清單 - 此子工作包包含的所有任務包
  completed: number;               // 已完成數量 - 已完成的工作項目總數量
  total: number;                   // 總數量 - 此子工作包包含的總工作項目數量
  progress: number;                // 進度百分比 - 完成進度的百分比值 (0-100)
  status?: 'draft' | 'in-progress' | 'submitted' | 'approved' | 'rejected'; // 狀態 - 子工作包當前狀態
  submittedAt?: string;            // 提交時間 - 子工作包提交的時間戳記
  approvedAt?: string;             // 核准時間 - 子工作包核准的時間戳記
  submittedBy?: string;            // 提交者 UID - 提交此子工作包的用戶
  approvedBy?: string;             // 核准者 UID - 核准此子工作包的用戶
}

/**
 * 工作包介面 - 代表專案中的主要工作分類，包含多個子工作包
 */
export interface Package { 
  name: string;                    // 工作包名稱 - 工作包的識別名稱
  time?: ScheduleTime;             // 時間排程 - 工作包的時間規劃和實際執行時間
  assigness?: string[];            // 指派人員 - 負責此工作包的人員清單
  reviewers?: string[];            // 審核者 - 此工作包的審核者（用戶 UID 陣列）
  submitters?: string[];           // 提交者 - 此工作包的提交者（用戶 UID 陣列）
  subpackages: SubPackage[];       // 子工作包清單 - 此工作包包含的所有子工作包
  completed: number;               // 已完成數量 - 已完成的工作項目總數量
  total: number;                   // 總數量 - 此工作包包含的總工作項目數量
  progress: number;                // 進度百分比 - 完成進度的百分比值 (0-100)
  status?: 'draft' | 'in-progress' | 'submitted' | 'approved' | 'rejected'; // 狀態 - 工作包當前狀態
  submittedAt?: string;            // 提交時間 - 工作包提交的時間戳記
  approvedAt?: string;             // 核准時間 - 工作包核准的時間戳記
  submittedBy?: string;            // 提交者 UID - 提交此工作包的用戶
  approvedBy?: string;             // 核准者 UID - 核准此工作包的用戶
}

/**
 * 專案介面 - 代表整個專案，包含多個工作包
 */
export interface Project {
  id: string;                      // 專案識別碼 - Firestore 文件唯一識別碼
  name: string;                    // 專案名稱 - 專案的識別名稱
  time?: ScheduleTime;             // 時間排程 - 專案的時間規劃和實際執行時間
  assigness?: string[];            // 指派人員 - 負責此專案的人員清單
  reviewers?: string[];            // 審核者 - 此專案的審核者（用戶 UID 陣列）
  manager?: string[];              // 經理 - 此專案的經理（用戶 UID 陣列）
  supervisor?: string[];           // 監工 - 此專案的監工（用戶 UID 陣列）
  safety?: string[];               // 公安 - 此專案的公安（用戶 UID 陣列）
  quality?: string[];              // 品管 - 此專案的品管（用戶 UID 陣列）
  region?: TaiwanCity;             // 地區 - 專案所在的台灣縣市
  address?: string;                // 地址 - 專案的詳細地址
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
  subInputs: Record<string, Record<number, Record<number, string>>>;                            // 子工作包輸入狀態 - 儲存各專案各工作包各子工作包輸入框的值
  setSubInputs: React.Dispatch<React.SetStateAction<Record<string, Record<number, Record<number, string>>>>>; // 子工作包輸入狀態設定器 - 更新子工作包輸入框的值
  onAddTaskPackage: (projectId: string, pkgIdx: number, subIdx: number, taskPackageName: string) => Promise<void>; // 新增任務包回調 - 新增任務包的異步函數
}

/**
 * 子工作包節點組件屬性介面 - 定義子工作包節點組件所需的屬性
 */
export interface ProjectSubPackageNodeProps extends TreeComponentProps {
  project: Project;                                                                             // 專案資料 - 要顯示的專案物件
  packageIndex: number;                                                                         // 工作包索引 - 當前工作包在專案中的索引位置
  subpackageIndex: number;                                                                      // 子工作包索引 - 當前子工作包在工作包中的索引位置
  onAddTaskPackage: (projectId: string, pkgIdx: number, subIdx: number, taskPackageName: string) => Promise<void>; // 新增任務包回調 - 新增任務包的異步函數
  subInputs: Record<string, Record<number, Record<number, string>>>;                            // 子工作包輸入狀態 - 儲存各專案各工作包各子工作包輸入框的值
  setSubInputs: React.Dispatch<React.SetStateAction<Record<string, Record<number, Record<number, string>>>>>; // 子工作包輸入狀態設定器 - 更新子工作包輸入框的值
}

/**
 * 任務包節點組件屬性介面 - 定義任務包節點組件所需的屬性
 */
export interface ProjectTaskPackageNodeProps extends TreeComponentProps {
  project: Project;                                                                             // 專案資料 - 要顯示的專案物件
  packageIndex: number;                                                                         // 工作包索引 - 當前工作包在專案中的索引位置
  subpackageIndex: number;                                                                      // 子工作包索引 - 當前子工作包在工作包中的索引位置
  taskIndex: number;                                                                            // 任務索引 - 當前任務在子工作包中的索引位置
}

/**
 * 通知介面 - 代表系統通知
 */
export interface Notification {
  id?: string;                     // 通知 ID - Firestore 文件唯一識別碼
  title: string;                   // 通知標題 - 通知的主要標題
  message: string;                 // 通知內容 - 通知的詳細內容
  type: 'info' | 'warning' | 'error' | 'success' | 'task' | 'review'; // 通知類型
  targetUid: string;               // 目標用戶 UID - 接收通知的用戶
  isRead: boolean;                 // 是否已讀 - 標記通知是否已被用戶讀取
  createdAt: string;               // 建立時間 - 通知建立的時間戳記
  data?: {                         // 附加數據 - 通知相關的額外資訊
    projectId?: string;            // 專案 ID
    packageIndex?: number;         // 工作包索引
    subpackageIndex?: number;      // 子工作包索引
    taskIndex?: number;            // 任務索引
    action?: string;               // 動作類型
  };
}

/**
 * 用戶任務介面 - 代表用戶的任務項目
 */
export interface UserTask {
  id: string;                      // 任務 ID
  name: string;                    // 任務名稱
  description?: string;            // 任務描述
  projectId: string;               // 專案 ID
  packageIndex: number;            // 工作包索引
  subpackageIndex: number;         // 子工作包索引
  taskIndex: number;               // 任務索引
  role: 'submitter' | 'reviewer';  // 用戶角色
  status?: 'draft' | 'in-progress' | 'submitted' | 'approved' | 'rejected'; // 任務狀態
  completed: number;               // 已完成數量
  total: number;                   // 總數量
  progress: number;                // 進度百分比
  assignedAt?: string;             // 指派時間
  submittedAt?: string;            // 提交時間
  approvedAt?: string;             // 核准時間
}

/**
 * 任務包模板介面 - 代表可重複使用的任務包範本
 */
export interface TaskPackageTemplate {
  id: string;                      // 模板 ID
  name: string;                    // 模板名稱
  description?: string;            // 模板描述
  defaultTotal: number;            // 預設工作項目總數量
  createdAt: string;               // 建立時間
  createdBy: string;               // 建立者 UID
}

/**
 * 子工作包模板介面 - 代表可重複使用的子工作包範本
 */
export interface SubPackageTemplate {
  id: string;                      // 模板 ID
  name: string;                    // 模板名稱
  description?: string;            // 模板描述
  taskPackageTemplates: string[];  // 預設包含的任務包模板 ID 清單
  createdAt: string;               // 建立時間
  createdBy: string;               // 建立者 UID
}

/**
 * 工作包模板介面 - 代表可重複使用的工作包範本
 */
export interface PackageTemplate {
  id: string;                      // 模板 ID
  name: string;                    // 模板名稱
  description?: string;            // 模板描述
  subPackageTemplates: string[];   // 預設包含的子工作包模板 ID 清單
  createdAt: string;               // 建立時間
  createdBy: string;               // 建立者 UID
}

/**
 * 專案模板介面 - 代表可重複使用的專案範本
 */
export interface ProjectTemplate {
  id: string;                      // 模板 ID
  name: string;                    // 模板名稱
  description?: string;            // 模板描述
  packageTemplates: string[];      // 預設包含的工作包模板 ID 清單
  createdAt: string;               // 建立時間
  createdBy: string;               // 建立者 UID
}

/**
 * 模板類型聯合型別
 */
export type TemplateType = 'project' | 'package' | 'subpackage' | 'taskpackage';

/**
 * 模板管理操作介面
 */
export interface TemplateOperations {
  createTemplate: (type: TemplateType, template: Omit<PackageTemplate | SubPackageTemplate | TaskPackageTemplate | ProjectTemplate, 'id' | 'createdAt' | 'createdBy'>) => Promise<string>;
  updateTemplate: (type: TemplateType, id: string, updates: Partial<PackageTemplate | SubPackageTemplate | TaskPackageTemplate | ProjectTemplate>) => Promise<void>;
  deleteTemplate: (type: TemplateType, id: string) => Promise<void>;
  getTemplates: (type: TemplateType) => Promise<(PackageTemplate | SubPackageTemplate | TaskPackageTemplate | ProjectTemplate)[]>;
}
