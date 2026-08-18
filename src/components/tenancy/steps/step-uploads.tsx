import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

export interface UploadedFile {
  id: string;
  name: string;
  date: string;
  size?: string;
  uri?: string;
  type?: string;
}

export interface StepUploadsProps {
  progressBarWidth: any;
  currentPageNumber: number;
  totalPages: number;
  activeDocTab: 'contract' | 'receipts';
  contractFiles: UploadedFile[];
  receiptFiles: UploadedFile[];
  onSelectTab: (tab: 'contract' | 'receipts') => void;
  onUploadPress: () => void;
  onDeleteFile: (id: string) => void;
}

export function StepUploads({
  progressBarWidth,
  currentPageNumber,
  totalPages,
  activeDocTab,
  contractFiles,
  receiptFiles,
  onSelectTab,
  onUploadPress,
  onDeleteFile,
}: StepUploadsProps) {
  const currentFiles = activeDocTab === 'contract' ? contractFiles : receiptFiles;
  const totalUploaded = contractFiles.length + receiptFiles.length;

  return (
    <View style={styles.content}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
        </View>
        <Text style={styles.progressText}>
          Page {currentPageNumber} of {totalPages}
        </Text>
      </View>

      {/* Title & Subtitle */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionMainTitle}>Upload Documents</Text>
        <Text style={styles.sectionSubtitle}>
          Upload tenancy documents to auto-fill tenancy details
        </Text>
      </View>

      {/* Category Tabs (Fixed width, left aligned) */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.tabBoxCard,
            activeDocTab === 'contract' ? styles.tabBoxActive : styles.tabBoxInactive,
          ]}
          onPress={() => onSelectTab('contract')}
          activeOpacity={0.7}
        >
          <SymbolView
            name={{ ios: 'creditcard', android: 'credit_card', web: 'credit_card' }}
            size={26}
            tintColor={activeDocTab === 'contract' ? '#D87C24' : '#6C757D'}
          />
          <Text
            style={[
              styles.tabBoxText,
              activeDocTab === 'contract' ? styles.tabBoxTextActive : styles.tabBoxTextInactive,
            ]}
          >
            Tenancy{'\n'}Contract
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBoxCard,
            activeDocTab === 'receipts' ? styles.tabBoxActive : styles.tabBoxInactive,
          ]}
          onPress={() => onSelectTab('receipts')}
          activeOpacity={0.7}
        >
          <SymbolView
            name={{ ios: 'receipt', android: 'receipt', web: 'receipt' }}
            size={26}
            tintColor={activeDocTab === 'receipts' ? '#D87C24' : '#6C757D'}
          />
          <Text
            style={[
              styles.tabBoxText,
              activeDocTab === 'receipts' ? styles.tabBoxTextActive : styles.tabBoxTextInactive,
            ]}
          >
            Rent{'\n'}Receipts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Upload Drag & Drop Area */}
      <TouchableOpacity
        style={styles.uploadDropzone}
        onPress={onUploadPress}
        activeOpacity={0.8}
      >
        <SymbolView
          name={{ ios: 'square.and.arrow.up', android: 'upload', web: 'upload' }}
          size={32}
          tintColor="#D87C24"
        />
        <Text style={styles.uploadMainText}>Tap to upload to drag files here.</Text>
        <Text style={styles.uploadSubText}>JPG, PNG, WEBP,PDF (max. 5MB)</Text>
      </TouchableOpacity>

      {/* Uploaded Documents Section */}
      <View style={styles.documentListSection}>
        <View style={styles.docSectionHeader}>
          <Text style={styles.docSectionTitle}>Uploaded Documents</Text>
          <Text style={styles.docSectionStatus}>
            {totalUploaded > 0 ? `${totalUploaded}/2 Uploaded` : '0/2 Uploaded'}
          </Text>
        </View>

        {currentFiles.length === 0 ? (
          <View style={styles.emptyDocNotice}>
            <Text style={styles.emptyDocNoticeText}>
              No {activeDocTab === 'contract' ? 'tenancy contract' : 'rent receipt'} uploaded yet.
            </Text>
          </View>
        ) : (
          currentFiles.map((file) => (
            <View key={file.id} style={styles.uploadedDocCard}>
              <View style={styles.docThumbnail}>
                <View style={styles.thumbnailLineShort} />
                <View style={styles.thumbnailLineLong} />
                <View style={styles.thumbnailLineMedium} />
                <View style={styles.thumbnailLineLong} />
                <View style={styles.thumbnailLineShort} />
              </View>

              <View style={styles.docDetailsCol}>
                <Text style={styles.docTitle} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.docDate}>{file.size || '102KB'}</Text>
              </View>

              <TouchableOpacity
                style={styles.deleteFileBtnSquare}
                onPress={() => onDeleteFile(file.id)}
                activeOpacity={0.7}
              >
                <SymbolView
                  name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                  size={15}
                  tintColor="#E53935"
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#EBE6DC',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFA726',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#8A8D93',
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionMainTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'flex-start',
  },
  tabBoxCard: {
    width: 80,
    height: 102,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  tabBoxActive: {
    borderWidth: 1,
    borderColor: '#FFE0B2',
    backgroundColor: '#FFFDF9',
  },
  tabBoxInactive: {
    borderWidth: 1,
    borderColor: '#F0EDE6',
    backgroundColor: '#FFFFFF',
  },
  tabBoxText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  tabBoxTextActive: {
    fontFamily: 'Satoshi-Bold',
    color: '#D87C24',
    fontWeight: '700',
  },
  tabBoxTextInactive: {
    color: '#4A4D54',
  },
  uploadDropzone: {
    height: 148,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#B0B3BA',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  uploadMainText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#1A1C1E',
    fontWeight: '700',
    textAlign: 'center',
  },
  uploadSubText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
    textAlign: 'center',
  },
  documentListSection: {
    marginTop: 4,
  },
  docSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  docSectionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
  },
  docSectionStatus: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#D87C24',
    fontWeight: '700',
  },
  emptyDocNotice: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0EDE6',
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
  },
  emptyDocNoticeText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#8A8D93',
  },
  uploadedDocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    marginBottom: 10,
  },
  docThumbnail: {
    width: 34,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    padding: 4,
    justifyContent: 'space-between',
    marginRight: 12,
  },
  thumbnailLineShort: {
    height: 1.5,
    backgroundColor: '#C5C7CC',
    borderRadius: 1,
    width: '45%',
  },
  thumbnailLineMedium: {
    height: 1.5,
    backgroundColor: '#C5C7CC',
    borderRadius: 1,
    width: '75%',
  },
  thumbnailLineLong: {
    height: 1.5,
    backgroundColor: '#C5C7CC',
    borderRadius: 1,
    width: '100%',
  },
  docDetailsCol: {
    flex: 1,
    marginRight: 8,
  },
  docTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 3,
  },
  docDate: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
  },
  deleteFileBtnSquare: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD6D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
