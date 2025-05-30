import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';


Font.register({
    family: 'NotoSerifTC',
    src: '/fonts/NotoSerifTC-Regular.ttf',
});

export function ContractPdfDocument({ contract }: { contract: Record<string, unknown> }) {
    const contractItems = Array.isArray(contract.contractItems) ? contract.contractItems : [];
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                    <Text style={styles.title}>合約明細</Text>
                    <Text>合約名稱: {String(contract.contractName ?? '')}</Text>
                    <Text>客戶名稱: {String(contract.clientName ?? '')}</Text>
                    <Text>聯絡人: {String(contract.clientContact ?? '')}</Text>
                    <Text>電話: {String(contract.clientPhone ?? '')}</Text>
                    <Text>Email: {String(contract.clientEmail ?? '')}</Text>
                    <Text>價格: {String(contract.contractPrice ?? '')}</Text>
                    <Text>建立日期: {contract.createdAt && typeof contract.createdAt === 'object' && 'toLocaleDateString' in contract.createdAt ? (contract.createdAt as Date).toLocaleDateString() : '-'}</Text>
                    <Text>修改日期: {contract.updatedAt && typeof contract.updatedAt === 'object' && 'toLocaleDateString' in contract.updatedAt ? (contract.updatedAt as Date).toLocaleDateString() : '-'}</Text>
                </View>
                {contractItems.length > 0 && (
                    <View style={styles.section}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>合約項目</Text>
                        <View style={{ flexDirection: 'row', borderBottom: 1, marginBottom: 4 }}>
                            <Text style={{ width: '30%' }}>項目ID</Text>
                            <Text style={{ width: '20%' }}>單價</Text>
                            <Text style={{ width: '20%' }}>數量</Text>
                            <Text style={{ width: '30%' }}>權重</Text>
                        </View>
                        {contractItems.map((item, idx) => (
                            <View key={item.contractItemId || idx} style={{ flexDirection: 'row', marginBottom: 2 }}>
                                <Text style={{ width: '30%' }}>{String(item.contractItemId ?? '')}</Text>
                                <Text style={{ width: '20%' }}>{String(item.contractItemPrice ?? '')}</Text>
                                <Text style={{ width: '20%' }}>{String(item.contractItemQuantity ?? '')}</Text>
                                <Text style={{ width: '30%' }}>{item.contractItemWeight !== undefined ? String(item.contractItemWeight) : '-'}</Text>
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
