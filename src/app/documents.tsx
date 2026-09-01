import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { BackButton } from '@/components/auth/back-button';
import { PdfPreviewModal } from '@/components/documents/pdf-preview-modal';
import { setActiveTab } from '@/utils/user-store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDocuments, ApiDocument, ApiContract } from '@/store/slices/document-slice';
import { downloadDocumentAsPdf } from '@/utils/pdf-download-service';
import { AppScreen } from '@/components/ui/app-screen';

export interface UnifiedDocumentItem {
  id: string;
  title: string;
  date: string;
  format: 'PDF' | 'IMG' | 'DOC';
  tag: 'SIGNED BY TENANT' | 'MY COPY' | 'PROOF';
  fileUrl?: string;
  mimeType?: string;
  contractText?: string;
  rawType?: string;
}

export default function DocumentsScreen() {
  const dispatch = useAppDispatch();
  const { documents, contracts, isLoading } = useAppSelector((state) => state.documents);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<UnifiedDocumentItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchDocuments());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchDocuments());
    setRefreshing(false);
  };

  const handleBack = () => {
    setActiveTab('home');
  };

  const formatDate = (dateValue?: any) => {
    if (!dateValue) return 'Recent';
    try {
      let d: Date;
      if (typeof dateValue === 'number') {
        d = new Date(dateValue > 1e11 ? dateValue : dateValue * 1000);
      } else if (typeof dateValue === 'string') {
        if (/^\d+$/.test(dateValue)) {
          const num = Number(dateValue);
          d = new Date(num > 1e11 ? num : num * 1000);
        } else {
          d = new Date(dateValue);
        }
      } else {
        d = new Date(dateValue);
      }

      if (isNaN(d.getTime())) return String(dateValue);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strHours = String(hours).padStart(2, '0');

      return `${day}/${month}/${year}, ${strHours}:${minutes} ${ampm}`;
    } catch {
      return 'Recent';
    }
  };

  // Merge API documents and contracts
  const allItems: UnifiedDocumentItem[] = useMemo(() => {
    const list: UnifiedDocumentItem[] = [];

    contracts.forEach((contract: any) => {
      const rawUrl = contract.fileUrl || contract.url || contract.uri || contract.pdfUrl;
      const title =
        contract.title ||
        contract.name ||
        (contract.property?.propertyName
          ? `Tenancy Agreement - ${contract.property.propertyName}`
          : 'Tenancy Agreement');

      list.push({
        id: contract.id || `contract-${contract.tenancyId || Math.random()}`,
        title,
        date: formatDate(contract.createdAt || contract.generatedAt || contract.sentAt || contract.updatedAt),
        format: 'PDF',
        tag: 'SIGNED BY TENANT',
        contractText: contract.contractText,
        fileUrl: rawUrl,
        rawType: 'contract',
      });
    });

    documents.forEach((doc: any) => {
      const rawUrl =
        doc.fileUrl ||
        doc.url ||
        doc.uri ||
        doc.path ||
        doc.downloadUrl ||
        doc.publicUrl ||
        doc.imageUrl ||
        doc.attachmentUrl;

      const docType = doc.documentType || doc.type || 'document';

      const isPdf = Boolean(
        (doc.mimeType && doc.mimeType.toLowerCase().includes('pdf')) ||
        (doc.fileName && /\.pdf$/i.test(doc.fileName.trim())) ||
        (rawUrl && /\.pdf($|\?)/i.test(rawUrl))
      );

      const isImg = Boolean(
        !isPdf && (
          (doc.mimeType && doc.mimeType.toLowerCase().startsWith('image/')) ||
          (doc.fileName && /\.(jpg|jpeg|png|webp|gif|bmp|heic)$/i.test(doc.fileName.trim())) ||
          (rawUrl && /\.(jpg|jpeg|png|webp|gif|bmp|heic)($|\?)/i.test(rawUrl)) ||
          docType.includes('receipt')
        )
      );

      let cleanTitle = doc.fileName;
      if (!cleanTitle || cleanTitle.includes('_') && /^\d+/.test(cleanTitle)) {
        if (docType === 'rent_receipt' || docType === 'receipt') {
          cleanTitle = doc.property?.propertyName
            ? `Rent Receipt - ${doc.property.propertyName}`
            : 'Rent Receipt';
        } else if (docType === 'proof_of_ownership') {
          cleanTitle = doc.property?.propertyName
            ? `Proof of Ownership - ${doc.property.propertyName}`
            : 'Proof of Ownership';
        } else if (docType === 'proof_of_insurance') {
          cleanTitle = doc.property?.propertyName
            ? `Proof of Insurance - ${doc.property.propertyName}`
            : 'Proof of Insurance';
        } else if (docType === 'tenancy_contract' || docType === 'contract') {
          cleanTitle = doc.property?.propertyName
            ? `Tenancy Agreement - ${doc.property.propertyName}`
            : 'Tenancy Agreement';
        } else {
          cleanTitle = docType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        }
      }

      const tag: 'SIGNED BY TENANT' | 'MY COPY' | 'PROOF' =
        docType.includes('receipt') || docType.includes('proof')
          ? 'PROOF'
          : docType.includes('contract')
          ? 'SIGNED BY TENANT'
          : 'MY COPY';

      list.push({
        id: doc.id || `doc-${Math.random()}`,
        title: cleanTitle,
        date: formatDate(doc.createdAt || doc.updatedAt || doc.date || doc.uploadedAt),
        format: isImg ? 'IMG' : isPdf ? 'PDF' : 'DOC',
        tag,
        fileUrl: rawUrl,
        mimeType: doc.mimeType,
        rawType: docType,
      });
    });

    return list;
  }, [documents, contracts]);

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    return allItems.filter((doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allItems, searchQuery]);

  const recentDocuments = useMemo(() => {
    return filteredDocuments.slice(0, 4);
  }, [filteredDocuments]);

  const handleShareDoc = async (item: UnifiedDocumentItem) => {
    await downloadDocumentAsPdf({
      filename: item.title,
      contractText: item.contractText,
      fileUrl: item.fileUrl,
    });
  };

  const handleDownloadDoc = async (item: UnifiedDocumentItem) => {
    await downloadDocumentAsPdf({
      filename: item.title,
      contractText: item.contractText,
      fileUrl: item.fileUrl,
    });
  };

  const renderRecentCard = ({ item }: { item: UnifiedDocumentItem }) => (
    <View style={styles.recentCard}>
      <Text style={styles.recentCardTitle} numberOfLines={2}>
        {item.title}
      </Text>

      <View style={styles.recentCardMeta}>
        <View style={styles.metaRow}>
          <SymbolView
            name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
            size={12}
            tintColor="#6C757D"
          />
          <Text style={styles.metaText}>{item.date}</Text>
        </View>

        <View style={styles.metaRow}>
          <SymbolView
            name={{
              ios: item.format === 'IMG' ? 'photo' : 'doc',
              android: item.format === 'IMG' ? 'image' : 'description',
              web: item.format === 'IMG' ? 'image' : 'description',
            }}
            size={12}
            tintColor="#6C757D"
          />
          <Text style={styles.metaText}>{item.format}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.openBtn}
        activeOpacity={0.7}
        onPress={() => setSelectedDoc(item)}
      >
        <Text style={styles.openBtnText}>Open</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAllRow = ({ item }: { item: UnifiedDocumentItem }) => (
    <View style={styles.documentRow}>
      {/* Left side details */}
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <View
          style={[
            styles.tag,
            item.tag === 'SIGNED BY TENANT'
              ? styles.tagSigned
              : item.tag === 'PROOF'
              ? styles.tagProof
              : styles.tagCopy,
          ]}
        >
          <Text
            style={[
              styles.tagText,
              item.tag === 'SIGNED BY TENANT'
                ? styles.tagSignedText
                : item.tag === 'PROOF'
                ? styles.tagProofText
                : styles.tagCopyText,
            ]}
          >
            {item.tag}
          </Text>
        </View>
      </View>

      {/* Right side details & actions */}
      <View style={styles.rowRight}>
        <Text style={styles.dateText}>Date: {item.date}</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.viewBtn}
            activeOpacity={0.7}
            onPress={() => setSelectedDoc(item)}
          >
            <Text style={styles.viewBtnText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.downloadBtn}
            activeOpacity={0.7}
            onPress={() => handleDownloadDoc(item)}
          >
            <Text style={styles.downloadBtnText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <AppScreen edges={['top', 'left', 'right']}>
      {/* Header bar */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <Text style={styles.headerTitle}>Documents</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFA726" />
        }
      >
        {/* Search bar row */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              size={18}
              tintColor="#6C757D"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Documents"
              placeholderTextColor="#8A8D93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <SymbolView
                  name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                  size={16}
                  tintColor="#8A8D93"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Loading Indicator */}
        {isLoading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FFA726" />
            <Text style={styles.loadingText}>Loading documents...</Text>
          </View>
        )}

        {/* Recently Shared Section */}
        {recentDocuments.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recently Shared</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentListContent}
            >
              {recentDocuments.map((item) => (
                <View key={`recent-${item.id}`}>
                  {renderRecentCard({ item })}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Documents Section */}
        <View style={[styles.sectionContainer, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>All Documents</Text>
          {filteredDocuments.length > 0 ? (
            <View style={styles.allListContent}>
              {filteredDocuments.map((item) => (
                <View key={`all-${item.id}`}>
                  {renderAllRow({ item })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? `No documents found matching "${searchQuery}"`
                  : 'No documents uploaded yet.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Document Preview Modal overlay */}
      {selectedDoc && (
        <PdfPreviewModal
          visible={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          documentTitle={selectedDoc.title}
          contractText={selectedDoc.contractText}
          fileUrl={selectedDoc.fileUrl}
          mimeType={selectedDoc.mimeType}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE6',
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    color: '#1A1C1E',
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE6DC',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#1A1C1E',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#8A8D93',
  },
  sectionContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#1A1C1E',
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  recentListContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  recentCard: {
    width: 195,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    padding: 14,
    justifyContent: 'space-between',
  },
  recentCardTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 8,
    minHeight: 36,
  },
  recentCardMeta: {
    flexDirection: 'column',
    gap: 6,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: '#6C757D',
  },
  openBtn: {
    backgroundColor: '#FFF4E6',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#D87C24',
    fontWeight: '700',
  },
  allListContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  documentRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flex: 1,
    marginRight: 10,
  },
  rowTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 6,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagSigned: {
    backgroundColor: '#E8F5E9',
  },
  tagProof: {
    backgroundColor: '#E3F2FD',
  },
  tagCopy: {
    backgroundColor: '#FFF4E6',
  },
  tagText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagSignedText: {
    color: '#2E7D32',
  },
  tagProofText: {
    color: '#1976D2',
  },
  tagCopyText: {
    color: '#D87C24',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 10,
    color: '#8A8D93',
    marginBottom: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewBtn: {
    backgroundColor: '#FFF4E6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  viewBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: '#D87C24',
    fontWeight: '700',
  },
  downloadBtn: {
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  downloadBtnText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: '#616161',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#8A8D93',
    textAlign: 'center',
  },
});
