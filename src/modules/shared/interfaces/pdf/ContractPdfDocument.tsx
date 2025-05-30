import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';


Font.register({
    family: 'NotoSerifTC',
    src: '/fonts/NotoSerifTC-Regular.ttf',
});

export function ContractPdfDocument({ contract, qrCodeDataUrl }: { contract: Record<string, unknown>; qrCodeDataUrl?: string }) {
    const contractItems = Array.isArray(contract.contractItems) ? contract.contractItems : [];
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* 左上角 QRCode 圖片 */}
                {qrCodeDataUrl && (
                    <View
                        style={{
                            position: 'absolute',
                            right: 30,
                            bottom: 30,
                            alignItems: 'center',
                        }}
                    >
                        {/* @react-pdf/renderer 的 <Image> 不支援 alt 屬性，已確認無需加 alt，忽略 jsx-a11y/alt-text 警告 */}
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image src={qrCodeDataUrl} style={{ width: 64, height: 64 }} />
                        <Text style={{ fontSize: 8, marginTop: 2 }}>掃描查看合約</Text>
                    </View>
                )}
                <View style={styles.section}>
                    <Text style={[styles.title, { textAlign: 'center' }]}>工程承攬合約書</Text>
                    <Text>合約名稱: {String(contract.contractName ?? '')}</Text>
                    <Text>合約金額: {String(contract.contractPrice ?? '')}</Text>
                    <Text>客戶名稱: {String(contract.clientName ?? '')}</Text>
                    <Text>聯絡人: {String(contract.clientContact ?? '')}</Text>
                    <Text>電話: {String(contract.clientPhone ?? '')}</Text>
                    <Text>Email: {String(contract.clientEmail ?? '')}</Text>
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
                {/* 合約條款內容 */}
                <View style={styles.section}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>合約條款</Text>
                    {String(contract.contractContent || '（無內容）')
                        .split('\n')
                        .map((line, idx) => (
                            <Text key={idx} style={{ fontSize: 10 }}>{line}</Text>
                        ))}
                </View>
            </Page>
        </Document>
    );
}

const styles = StyleSheet.create({
    page: { padding: 30, fontFamily: 'NotoSerifTC', position: 'relative' },
    section: { margin: 10, padding: 10 },
    title: { fontSize: 18, marginBottom: 10, fontWeight: 'bold', textAlign: 'center' },
});
