/**
 * 傳回一個 promise，延遲指定毫秒後 resolve。
 * @param ms 延遲的毫秒數
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
