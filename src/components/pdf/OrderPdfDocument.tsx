/**
 * 訂單 PDF 文件組件
 * 生成訂單的 PDF 文件格式
 * 顯示訂單基本資訊和項目明細
 * 支援訂單資料的格式化輸出
 */

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Timestamp } from "firebase/firestore";
import { formatLocalDate } from '@/utils/dateUtils';

Font.register({
    family: 'NotoSerifTC',
    src: '/fonts/NotoSerifTC-Regular.ttf',
});

const formatDate = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) return "";
    return formatLocalDate(timestamp);
};

export function OrderPdfDocument({ order }: { order: Record<string, unknown> }) {
    const orderItems = Array.isArray(order.orderItems) ? order.orderItems : [];
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                    <Text style={styles.title}>訂單明細</Text>
                    <Text>訂單名稱: {String(order.orderName ?? '')}</Text>
                    <Text>客戶名稱: {String(order.clientName ?? '')}</Text>
                    <Text>聯絡人: {String(order.clientContact ?? '')}</Text>
                    <Text>電話: {String(order.clientPhone ?? '')}</Text>
                    <Text>Email: {String(order.clientEmail ?? '')}</Text>
                    <Text>價格: {String(order.orderPrice ?? '')}</Text>
                    <Text>建立日期: {formatDate(order.createdAt as Timestamp | null | undefined) ?? '-'}</Text>
                    <Text>修改日期: {formatDate(order.updatedAt as Timestamp | null | undefined) ?? '-'}</Text>
                </View>
                {orderItems.length > 0 && (
                    <View style={styles.section}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>訂單項目</Text>
                        <View style={{ flexDirection: 'row', borderBottom: 1, marginBottom: 4 }}>
                            <Text style={{ width: '40%' }}>項目ID</Text>
                            <Text style={{ width: '30%' }}>單價</Text>
                            <Text style={{ width: '30%' }}>數量</Text>
                        </View>
                        {orderItems.map((item, idx) => (
                            <View key={item.orderItemId || idx} style={{ flexDirection: 'row', marginBottom: 2 }}>
                                <Text style={{ width: '40%' }}>{String(item.orderItemId ?? '')}</Text>
                                <Text style={{ width: '30%' }}>{String(item.orderItemPrice ?? '')}</Text>
                                <Text style={{ width: '30%' }}>{String(item.orderItemQuantity ?? '')}</Text>
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
