import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';


Font.register({
    family: 'NotoSerifTC',
    src: '/fonts/NotoSerifTC-Regular.ttf',
});

export function OrderPdfDocument({ order }: { order: Record<string, unknown> }) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                    <Text style={styles.title}>訂單明細</Text>
                    <Text>訂單名稱: {String(order.orderName ?? '')}</Text>
                    <Text>客戶名稱: {String(order.clientName ?? '')}</Text>
                    <Text>價格: {String(order.orderPrice ?? '')}</Text>
                    <Text>建立日期: {order.createdAt && typeof order.createdAt === 'object' && 'toLocaleDateString' in order.createdAt ? (order.createdAt as Date).toLocaleDateString() : '-'}</Text>
                    <Text>修改日期: {order.updatedAt && typeof order.updatedAt === 'object' && 'toLocaleDateString' in order.updatedAt ? (order.updatedAt as Date).toLocaleDateString() : '-'}</Text>
                </View>
            </Page>
        </Document>
    );
}

const styles = StyleSheet.create({
    page: { padding: 30, fontFamily: 'NotoSerifTC' },
    section: { margin: 10, padding: 10 },
    title: { fontSize: 18, marginBottom: 10, fontWeight: 'bold' },
});
