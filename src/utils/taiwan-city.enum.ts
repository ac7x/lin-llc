/**
 * 台灣縣市資料模組
 * 提供台灣縣市相關的枚舉定義與輔助功能
 * 功能：
 * - TaiwanCity: 縣市枚舉定義
 * - TaiwanCityInfo: 縣市詳細資訊介面
 * - TaiwanCityList: 完整的縣市資料列表
 * - getWeatherInfo: 取得縣市天氣查詢資訊的輔助函式
 */

// 台灣縣市枚舉與相關資訊，適用於下拉選單與天氣查詢

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

export interface TaiwanCityInfo {
    value: TaiwanCity;
    label: string;
    owmQuery: string; // OpenWeatherMap API 查詢用字串
}

export const TaiwanCityList: TaiwanCityInfo[] = [
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
    {
        value: TaiwanCity.TaoyuanCity,
        label: '桃園市',
        owmQuery: 'Taoyuan,tw'
    },
    {
        value: TaiwanCity.TaichungCity,
        label: '台中市',
        owmQuery: 'Taichung,tw'
    },
    {
        value: TaiwanCity.TainanCity,
        label: '台南市',
        owmQuery: 'Tainan,tw'
    },
    {
        value: TaiwanCity.KaohsiungCity,
        label: '高雄市',
        owmQuery: 'Kaohsiung,tw'
    },
    {
        value: TaiwanCity.KeelungCity,
        label: '基隆市',
        owmQuery: 'Keelung,tw'
    },
    {
        value: TaiwanCity.HsinchuCity,
        label: '新竹市',
        owmQuery: 'Hsinchu,tw'
    },
    {
        value: TaiwanCity.HsinchuCounty,
        label: '新竹縣',
        owmQuery: 'Hsinchu County,tw'
    },
    {
        value: TaiwanCity.MiaoliCounty,
        label: '苗栗縣',
        owmQuery: 'Miaoli,tw'
    },
    {
        value: TaiwanCity.ChanghuaCounty,
        label: '彰化縣',
        owmQuery: 'Changhua,tw'
    },
    {
        value: TaiwanCity.NantouCounty,
        label: '南投縣',
        owmQuery: 'Nantou,tw'
    },
    {
        value: TaiwanCity.YunlinCounty,
        label: '雲林縣',
        owmQuery: 'Yunlin,tw'
    },
    {
        value: TaiwanCity.ChiayiCity,
        label: '嘉義市',
        owmQuery: 'Chiayi,tw'
    },
    {
        value: TaiwanCity.ChiayiCounty,
        label: '嘉義縣',
        owmQuery: 'Chiayi County,tw'
    },
    {
        value: TaiwanCity.PingtungCounty,
        label: '屏東縣',
        owmQuery: 'Pingtung,tw'
    },
    {
        value: TaiwanCity.YilanCounty,
        label: '宜蘭縣',
        owmQuery: 'Yilan,tw'
    },
    {
        value: TaiwanCity.HualienCounty,
        label: '花蓮縣',
        owmQuery: 'Hualien,tw'
    },
    {
        value: TaiwanCity.TaitungCounty,
        label: '台東縣',
        owmQuery: 'Taitung,tw'
    },
    {
        value: TaiwanCity.PenghuCounty,
        label: '澎湖縣',
        owmQuery: 'Penghu,tw'
    },
    {
        value: TaiwanCity.KinmenCounty,
        label: '金門縣',
        owmQuery: 'Kinmen,tw'
    },
    {
        value: TaiwanCity.LienchiangCounty,
        label: '連江縣',
        owmQuery: 'Lienchiang,tw'
    },
];

// 為了向後相容，提供一個快速取得純天氣資訊的輔助函式
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
