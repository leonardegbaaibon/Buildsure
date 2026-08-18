import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { DocumentPreviewCard } from './document-preview-card';

interface PdfPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  documentTitle: string;
  contractText?: string | null;
  fileUrl?: string;
  mimeType?: string;
}

export function PdfPreviewModal({
  visible,
  onClose,
  documentTitle,
  contractText,
  fileUrl,
  mimeType,
}: PdfPreviewModalProps) {
  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalDismissArea}
          activeOpacity={1}
          onPress={onClose}
        />
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContent}>
            <DocumentPreviewCard
              filename={documentTitle}
              contractText={contractText}
              fileUrl={fileUrl}
              mimeType={mimeType}
              onClose={onClose}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalSafeArea: {
    width: '94%',
    maxWidth: 420,
    zIndex: 10,
  },
  modalContent: {
    width: '100%',
  },
});
