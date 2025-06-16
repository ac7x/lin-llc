/**
 * 地理位置相關常數定義
 * 包含台灣縣市枚舉和相關資訊
 */

// 台灣縣市枚舉
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

// 縣市資訊介面
export interface TaiwanCityInfo {
  value: TaiwanCity;
  label: string;
  owmQuery: string; // OpenWeatherMap API 查詢用字串
}

// 完整的縣市資料列表
export const TaiwanCityList: readonly TaiwanCityInfo[] = [
  {
    value: TaiwanCity.TaipeiCity,
    label: '台北市',
    owmQuery: 'Taipei,tw'
  },
  {
    value: TaiwanCity.NewTaipeiCity,
    label: '新北市',
    owmQuery: 'New Taipei,tw'
  },
  // ... 其他縣市資料
] as const;

// 取得縣市天氣資訊的輔助函式
export const getWeatherInfo = (city: TaiwanCity): { city: TaiwanCity; displayName: string; owmQuery: string } => {
  const cityInfo = TaiwanCityList.find(info => info.value === city);
  if (!cityInfo) {
    throw new Error(`找不到城市資訊: ${city}`);
  }
  return {
    city: cityInfo.value,
    displayName: cityInfo.label,
    owmQuery: cityInfo.owmQuery
  };
};
