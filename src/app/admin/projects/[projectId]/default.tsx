import OverviewPage from "./@overview/page";

export default function Default() {
    // 渲染 OverviewPage 作為此路由區段的預設內容。
    // 這有助於 Next.js 正確解析基礎路徑，
    // 進而使其能夠處理啟動平行路由插槽的子路徑。
    return <OverviewPage />;
}
