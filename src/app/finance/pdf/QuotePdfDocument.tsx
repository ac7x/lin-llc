/**
 * 報價單 PDF 文件組件
 * 生成報價單的 PDF 文件格式
 * 顯示報價單基本資訊和項目明細
 * 支援報價單資料的格式化輸出
 */

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

import { QuoteRow, QuoteItem } from '@/types/finance';

Font.register({
  family: 'NotoSerifTC',
  src: '/fonts/NotoSerifTC-Regular.ttf',
});

interface QuotePdfDocumentProps {
  quote: QuoteRow;
}

export const QuotePdfDocument = ({ quote }: QuotePdfDocumentProps) => (
  <Document>
    <Page size='A4' style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>估價單</Text>
        <Text>估價單名稱：{quote.quoteName}</Text>
        <Text>客戶名稱：{quote.clientName}</Text>
        <Text>估價金額：{quote.quotePrice}</Text>
        <Text>建立日期：{quote.createdAt ? quote.createdAt.toLocaleDateString() : '-'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.subtitle}>估價項目</Text>
        {quote.quoteItems.map((item: QuoteItem, index) => (
          <View key={item.quoteItemId || index} style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={{ width: '30%' }}>{String(item.quoteItemId ?? '')}</Text>
            <Text style={{ width: '25%' }}>{String(item.quoteItemPrice ?? '')}</Text>
            <Text style={{ width: '25%' }}>{String(item.quoteItemQuantity ?? '')}</Text>
            <Text style={{ width: '20%' }}>
              {item.quoteItemWeight !== undefined ? String(item.quoteItemWeight) : '-'}
            </Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'NotoSerifTC' },
  section: { margin: 10, padding: 10 },
  title: { fontSize: 18, marginBottom: 10, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginBottom: 10, fontWeight: 'bold' },
});
