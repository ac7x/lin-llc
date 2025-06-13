import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { Timestamp } from "firebase/firestore";
import type { Expense } from '@/types/finance';

Font.register({
    family: 'NotoSerifTC',
    src: '/fonts/NotoSerifTC-Regular.ttf',
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 30,
    },
    section: {
        margin: 10,
        padding: 10,
    },
    title: {
        fontSize: 24,
        marginBottom: 10,
        fontFamily: 'NotoSerifTC',
    },
});

export function ExpensePdfDocument({ expense, qrCodeDataUrl }: { expense: Record<string, unknown>; qrCodeDataUrl?: string }) {
    const formatNumber = (num: number) => {
        return num.toLocaleString('zh-TW');
    };

    const formatDate = (timestamp: Timestamp) => {
        return timestamp.toDate().toLocaleString('zh-TW');
    };

    const expensesTotal = Array.isArray(expense.expenses) 
        ? expense.expenses.reduce((sum: number, exp: Expense) => sum + (typeof exp.amount === 'number' ? exp.amount : 0), 0)
        : 0;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                    <Text style={styles.title}>支出明細</Text>
                    <Text>支出名稱: {String(expense.expenseName ?? '')}</Text>
                    <Text>客戶名稱: {String(expense.clientName ?? '')}</Text>
                    <Text>聯絡人: {String(expense.clientContact ?? '')}</Text>
                    <Text>電話: {String(expense.clientPhone ?? '')}</Text>
                    <Text>Email: {String(expense.clientEmail ?? '')}</Text>
                    <Text>總金額: {formatNumber(expense.totalAmount as number)}</Text>
                    <Text>支出總額: {formatNumber(expensesTotal)}</Text>
                    <Text>建立日期: {formatDate(expense.createdAt as Timestamp)}</Text>
                    <Text>更新日期: {formatDate(expense.updatedAt as Timestamp)}</Text>
                </View>
                {qrCodeDataUrl && (
                    <View style={styles.section}>
                        <Image src={qrCodeDataUrl} />
                    </View>
                )}
            </Page>
        </Document>
    );
} 