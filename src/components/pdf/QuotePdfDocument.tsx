/**
 * 報價單 PDF 文件組件
 * 生成報價單的 PDF 文件格式
 * 顯示報價單基本資訊和項目明細
 * 支援報價單資料的格式化輸出
 */

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Timestamp } from "firebase/firestore";

Font.register({
    family: 'NotoSerifTC',
    src: '/fonts/NotoSerifTC-Regular.ttf',
});

const formatDate = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) return "";
    try {
        return timestamp.toDate().toLocaleDateString();
    } catch {
        return "";
    }
};

export function QuotePdfDocument({ quote }: { quote: Record<string, unknown> }) {
    const quoteItems = Array.isArray(quote.quoteItems) ? quote.quoteItems : [];
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                    <Text style={styles.title}>估價單明細</Text>
                    <Text>估價單名稱: {String(quote.quoteName ?? '')}</Text>
                    <Text>客戶名稱: {String(quote.clientName ?? '')}</Text>
                    <Text>聯絡人: {String(quote.clientContact ?? '')}</Text>
                    <Text>電話: {String(quote.clientPhone ?? '')}</Text>
                    <Text>Email: {String(quote.clientEmail ?? '')}</Text>
                    <Text>價格: {String(quote.quotePrice ?? '')}</Text>
                    <Text>建立日期: {formatDate(quote.createdAt as Timestamp | null | undefined) ?? '-'}</Text>
                    <Text>修改日期: {formatDate(quote.updatedAt as Timestamp | null | undefined) ?? '-'}</Text>
                </View>
                {quoteItems.length > 0 && (
                    <View style={styles.section}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>估價項目</Text>
                        <View style={{ flexDirection: 'row', borderBottom: 1, marginBottom: 4 }}>
                            <Text style={{ width: '30%' }}>項目ID</Text>
                            <Text style={{ width: '25%' }}>單價</Text>
                            <Text style={{ width: '25%' }}>數量</Text>
                            <Text style={{ width: '20%' }}>權重</Text>
                        </View>
                        {quoteItems.map((item, idx) => (
                            <View key={item.quoteItemId || idx} style={{ flexDirection: 'row', marginBottom: 2 }}>
                                <Text style={{ width: '30%' }}>{String(item.quoteItemId ?? '')}</Text>
                                <Text style={{ width: '25%' }}>{String(item.quoteItemPrice ?? '')}</Text>
                                <Text style={{ width: '25%' }}>{String(item.quoteItemQuantity ?? '')}</Text>
                                <Text style={{ width: '20%' }}>{item.quoteItemWeight !== undefined ? String(item.quoteItemWeight) : '-'}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </Page>
        </Document>
    );
}

const styles = StyleSheet.create({
    page: { padding: 30, fontFamily: 'NotoSerifTC' },
    section: { margin: 10, padding: 10 },
    title: { fontSize: 18, marginBottom: 10, fontWeight: 'bold' },
});
