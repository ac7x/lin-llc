import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export function QuotePdfDocument({ quote }: { quote: Record<string, unknown> }) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                    <Text style={styles.title}>估價單明細</Text>
                    <Text>估價單名稱: {String(quote.quoteName ?? '')}</Text>
                    <Text>客戶名稱: {String(quote.clientName ?? '')}</Text>
                    <Text>價格: {String(quote.quotePrice ?? '')}</Text>
                    <Text>建立日期: {quote.createdAt && typeof quote.createdAt === 'object' && 'toLocaleDateString' in quote.createdAt ? (quote.createdAt as Date).toLocaleDateString() : '-'}</Text>
                    <Text>修改日期: {quote.updatedAt && typeof quote.updatedAt === 'object' && 'toLocaleDateString' in quote.updatedAt ? (quote.updatedAt as Date).toLocaleDateString() : '-'}</Text>
                </View>
            </Page>
        </Document>
    );
}

const styles = StyleSheet.create({
    page: { padding: 30 },
    section: { margin: 10, padding: 10 },
    title: { fontSize: 18, marginBottom: 10, fontWeight: 'bold' },
});
