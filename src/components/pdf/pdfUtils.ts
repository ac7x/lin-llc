/**
 * PDF 匯出工具
 * 提供 PDF 文件的生成和下載功能
 * 支援 React 組件轉換為 PDF
 * 管理 PDF 文件的暫存和清理
 */

import { ReactElement } from 'react';
import { pdf } from '@react-pdf/renderer';

export async function generatePdfBlob(DocumentComponent: ReactElement, fileName: string) {
    const asPdf = pdf();
    asPdf.updateContainer(DocumentComponent);
    const blob = await asPdf.toBlob();
    // 建立下載連結
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}
