import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Timestamp } from "firebase/firestore";

Font.register({
    family: 'NotoSerifTC',
    src: '/fonts/NotoSerifTC-Regular.ttf',
});

const formatDate = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) return "";
    try {
        return timestamp.toDate().toLocaleDateString('zh-TW');
    } catch {
        return "";
    }
};

const formatNumber = (num: number | undefined | null): string => {
    if (typeof num !== 'number') return '-';
    return num.toLocaleString('zh-TW');
};

export function InvoicePdfDocument({ invoice, qrCodeDataUrl }: { invoice: Record<string, unknown>; qrCodeDataUrl?: string }) {
    // 計算支出總額
    const expenses = Array.isArray(invoice.expenses) ? invoice.expenses : [];
    const expensesTotal = expenses.reduce((sum: number, exp: Record<string, unknown>) => 
        sum + (typeof exp.amount === 'number' ? exp.amount : 0), 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* QR Code */}
                {qrCodeDataUrl && (
                    <View style={{
                        position: 'absolute',
                        right: 30,
                        bottom: 30,
                        alignItems: 'center',
                    }}>
                        <Image src={qrCodeDataUrl} style={{ width: 64, height: 64 }} />
                        <Text style={{ fontSize: 8, marginTop: 2 }}>掃描查看發票</Text>
                    </View>
                )}

                {/* 主要內容 */}
                <View style={styles.section}>
                    <Text style={styles.title}>請款明細</Text>
                    <Text>發票名稱: {typeof invoice.invoiceName === 'string' ? invoice.invoiceName : '-'}</Text>
                    <Text>客戶名稱: {typeof invoice.clientName === 'string' ? invoice.clientName : '-'}</Text>
                    <Text>聯絡人: {typeof invoice.clientContact === 'string' ? invoice.clientContact : '-'}</Text>
                    <Text>電話: {typeof invoice.clientPhone === 'string' ? invoice.clientPhone : '-'}</Text>
                    <Text>Email: {typeof invoice.clientEmail === 'string' ? invoice.clientEmail : '-'}</Text>
                    <Text>總金額: {formatNumber(invoice.totalAmount as number)}</Text>
                    <Text>支出總額: {formatNumber(expensesTotal)}</Text>
                    <Text>建立日期: {formatDate(invoice.createdAt as Timestamp)}</Text>
                    <Text>更新日期: {formatDate(invoice.updatedAt as Timestamp)}</Text>
                </View>

                {/* 支出項目列表 */}
                {expenses.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.subTitle}>支出項目</Text>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.cell, { width: '40%' }]}>項目名稱</Text>
                            <Text style={[styles.cell, { width: '30%' }]}>金額</Text>
                            <Text style={[styles.cell, { width: '30%' }]}>建立日期</Text>
                        </View>
                        {expenses.map((expense: Record<string, unknown>, idx: number) => (
                            <View key={typeof expense.expenseId === 'string' ? expense.expenseId : idx} style={styles.tableRow}>
                                <Text style={[styles.cell, { width: '40%' }]}>
                                    {typeof expense.expenseName === 'string' ? expense.expenseName : '-'}
                                </Text>
                                <Text style={[styles.cell, { width: '30%' }]}>
                                    {formatNumber(expense.amount as number)}
                                </Text>
                                <Text style={[styles.cell, { width: '30%' }]}>
                                    {formatDate(expense.createdAt as Timestamp)}
                                </Text>
                            </View>
                        ))}
                        <View style={[styles.tableRow, styles.totalRow]}>
                            <Text style={[styles.cell, { width: '40%' }]}>總計</Text>
                            <Text style={[styles.cell, { width: '30%' }]}>{formatNumber(expensesTotal)}</Text>
                            <Text style={[styles.cell, { width: '30%' }]}></Text>
                        </View>
                    </View>
                )}

                {/* 備註 */}
                {typeof invoice.notes === 'string' && invoice.notes && (
                    <View style={styles.section}>
                        <Text style={styles.subTitle}>備註</Text>
                        <Text>{invoice.notes}</Text>
                    </View>
                )}
            </Page>
        </Document>
    );
}

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'NotoSerifTC',
        position: 'relative'
    },
    section: {
        margin: 10,
        padding: 10
    },
    title: {
        fontSize: 18,
        marginBottom: 10,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    subTitle: {
        fontSize: 14,
        marginBottom: 6,
        fontWeight: 'bold'
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 4,
        marginBottom: 4
    },
    tableRow: {
        flexDirection: 'row',
        marginBottom: 2
    },
    cell: {
        fontSize: 10,
        padding: 2
    },
    totalRow: {
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 4,
        fontWeight: 'bold'
    }
});
