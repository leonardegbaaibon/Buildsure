import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { BackButton } from '@/components/auth/back-button';
import { PdfPreviewModal } from '@/components/documents/pdf-preview-modal';
import { setActiveTab } from '@/utils/user-store';

// Mock Documents Data
interface DocumentItem {
  id: string;
  title: string;
  date: string;
  format: string;
  tag: 'SIGNED BY TENANT' | 'MY COPY';
  pages: number;
}

const mockDocuments: DocumentItem[] = [
  {
    id: '1',
    title: 'Unit A1 Tenancy Contract',
    date: '26/5/2026',
    format: 'PDF',
    tag: 'SIGNED BY TENANT',
    pages: 4,
  },
  {
    id: '2',
    title: 'AWH Tenancy Agreement',
    date: '26/5/2026',
    format: 'PDF',
    tag: 'MY COPY',
    pages: 4,
  },
  {
    id: '3',
    title: 'Unit B2 Lease Contract',
    date: '18/6/2026',
    format: 'PDF',
    tag: 'SIGNED BY TENANT',
    pages: 3,
  },
  {
    id: '4',
    title: 'Service Charge Receipt',
    date: '02/7/2026',
    format: 'PDF',
    tag: 'MY COPY',
    pages: 1,
  },
  {
    id: '5',
    title: 'Landlord Insurance Policy',
    date: '10/4/2026',
    format: 'PDF',
    tag: 'MY COPY',
    pages: 5,
  },
];

export default function DocumentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  // Back button navigates back or replaces with home tab if stack is empty
  const handleBack = () => {
    setActiveTab('home');
  };

  // Filter documents based on search query
  const filteredDocuments = mockDocuments.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRecentCard = ({ item }: { item: DocumentItem }) => (
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
            name={{ ios: 'doc', android: 'description', web: 'description' }}
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

  const renderAllRow = ({ item }: { item: DocumentItem }) => (
    <View style={styles.documentRow}>
      {/* Left side details */}
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <View
          style={[
            styles.tag,
            item.tag === 'SIGNED BY TENANT' ? styles.tagSigned : styles.tagCopy,
          ]}
        >
          <Text
            style={[
              styles.tagText,
              item.tag === 'SIGNED BY TENANT' ? styles.tagSignedText : styles.tagCopyText,
            ]}
          >
            {item.tag}
          </Text>
        </View>
      </View>

      {/* Right side details & actions */}
      <View style={styles.rowRight}>
        <Text style={styles.dateText}>Date Modified: {item.date}</Text>
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
            onPress={() => {
              // Simulated download
              alert(`${item.title} has been downloaded.`);
            }}
          >
            <Text style={styles.downloadBtnText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <Text style={styles.headerTitle}>Documents</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search bar row */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              size={18}
              tintColor="#A0A5B0"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Anything on here"
              placeholderTextColor="#A0A5B0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filter button */}
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
            <SymbolView
              name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
              size={20}
              tintColor="#D87C24"
            />
          </TouchableOpacity>
        </View>

        {/* Recent Documents Section */}
        {filteredDocuments.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recent Documents</Text>
            <FlatList
              data={filteredDocuments}
              renderItem={renderRecentCard}
              keyExtractor={(item) => `recent-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentListContent}
              style={styles.recentList}
            />
          </View>
        )}

        {/* All Documents Section */}
        <View style={[styles.sectionContainer, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>All Documents</Text>
          {filteredDocuments.length > 0 ? (
            <FlatList
              data={filteredDocuments}
              renderItem={renderAllRow}
              keyExtractor={(item) => `all-${item.id}`}
              scrollEnabled={false}
              contentContainerStyle={styles.allListContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No documents found matching "{searchQuery}"</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* PDF Document Preview Modal overlay */}
      {selectedDoc && (
        <PdfPreviewModal
          visible={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          documentTitle={`${selectedDoc.title.replace(/\s+/g, '_')}.pdf`}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4', // Soft cream background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: '#D87C24', // Document screen header title color
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48, // Balances the back button size
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderColor: '#FFE3C6',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 15,
    color: '#1A1C1E',
    flex: 1,
  },
  filterBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionContainer: {},
  sectionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 16,
  },
  recentList: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  recentListContent: {
    gap: 16,
    paddingRight: 48, // Prevent cutoff at end of list
  },
  recentCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1.5,
  },
  recentCardTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#D87C24',
    lineHeight: 20,
    height: 40,
  },
  recentCardMeta: {
    gap: 6,
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
  },
  openBtn: {
    height: 36,
    borderWidth: 1.5,
    borderColor: '#FFA726',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  openBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#D87C24',
    fontWeight: '700',
  },
  allListContent: {
    gap: 16,
  },
  documentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
  },
  rowLeft: {
    flex: 1.2,
    gap: 8,
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
    lineHeight: 20,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagSigned: {
    backgroundColor: '#FFF8F0',
  },
  tagCopy: {
    backgroundColor: '#F0F1F3',
  },
  tagText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 10,
    fontWeight: '700',
  },
  tagSignedText: {
    color: '#D87C24',
  },
  tagCopyText: {
    color: '#6C757D',
  },
  rowRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 8,
  },
  dateText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 10,
    color: '#8A8D93',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewBtn: {
    width: 62,
    height: 32,
    borderWidth: 1.5,
    borderColor: '#FFA726',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#D87C24',
    fontWeight: '700',
  },
  downloadBtn: {
    width: 80,
    height: 32,
    backgroundColor: '#FFA726',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  downloadBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
});
