import { ReactElement } from 'react';
import { pdf } from '@react-pdf/renderer';

export async function exportPdfToBlob(DocumentComponent: ReactElement, fileName: string) {
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
