import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

interface PdfPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  documentTitle: string;
}

export function PdfPreviewModal({ visible, onClose, documentTitle }: PdfPreviewModalProps) {
  const [activePage, setActivePage] = useState(1);
  const totalPages = 4;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this document: ${documentTitle}`,
      });
    } catch (error) {
      console.log('Error sharing document:', error);
    }
  };

  const handleDownload = () => {
    Alert.alert('Download Complete', `${documentTitle} has been saved to your downloads folder.`);
  };

  const handlePrevPage = () => {
    if (activePage > 1) {
      setActivePage(activePage - 1);
    }
  };

  const handleNextPage = () => {
    if (activePage < totalPages) {
      setActivePage(activePage + 1);
    }
  };

  // Custom brick wall renderer using CSS/Views
  const renderBrickWall = () => {
    const rows = 12;
    const brickRows = [];

    for (let r = 0; r < rows; r++) {
      const isOffset = r % 2 !== 0;
      const bricks = [];

      if (isOffset) {
        // Offset row: half brick, then full bricks, then half brick
        bricks.push(<View key="start" style={[styles.brick, styles.halfBrick]} />);
        for (let b = 0; b < 6; b++) {
          bricks.push(<View key={b} style={styles.brick} />);
        }
        bricks.push(<View key="end" style={[styles.brick, styles.halfBrick]} />);
      } else {
        // Regular row: full bricks
        for (let b = 0; b < 7; b++) {
          bricks.push(<View key={b} style={styles.brick} />);
        }
      }

      brickRows.push(
        <View key={r} style={styles.brickRow}>
          {bricks}
        </View>
      );
    }

    return <View style={styles.brickWall}>{brickRows}</View>;
  };

  const renderPageContent = () => {
    switch (activePage) {
      case 1:
        return (
          <View style={styles.pageCover}>
            {/* Header branding */}
            <View style={styles.coverHeader}>
              <View style={styles.coverLogoCircle}>
                <View style={styles.coverLogoInner} />
              </View>
              <Text style={styles.coverLogoText}>BUILDSURE</Text>
            </View>

            {/* Title */}
            <View style={styles.coverTitleContainer}>
              <Text style={styles.coverTitleText}>TENANCY</Text>
              <Text style={styles.coverTitleTextAccent}>AGREEMENT</Text>
            </View>

            {/* Brick Wall Graphic */}
            <View style={styles.brickContainer}>
              {renderBrickWall()}
              {/* Bottom labels overlay */}
              <View style={styles.brickLabelsRow}>
                <Text style={styles.brickLabelText}>Buildsure Limited</Text>
                <Text style={styles.brickLabelText}>WWW.BUILDSURE.NG</Text>
              </View>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.pageTextContent}>
            <Text style={styles.pageHeader}>1. PARTIES & LEASED PREMISES</Text>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>
              This agreement is entered into on this 26th day of May, 2026, by and between{' '}
              <Text style={styles.boldText}>Baye Capital (Landlord)</Text> and{' '}
              <Text style={styles.boldText}>Saad Bashar (Tenant)</Text>.
            </Text>
            <Text style={styles.paragraph}>
              The landlord hereby leases to the tenant the residential property located at:{'\n'}
              <Text style={styles.boldText}>Unit A1, Apo-Wumba Homes, Abuja</Text>.
            </Text>
            <Text style={styles.pageHeader}>2. RENTAL TERM & PAYMENTS</Text>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>
              The tenancy term shall be for a duration of one (1) year, commencing from June 1, 2026,
              and expiring on May 31, 2027.
            </Text>
            <Text style={styles.paragraph}>
              The rent fee is set at <Text style={styles.boldText}>₦4,800,000</Text> per annum,
              payable in advance, with a security deposit of <Text style={styles.boldText}>₦500,000</Text>.
            </Text>
          </View>
        );
      case 3:
        return (
          <View style={styles.pageTextContent}>
            <Text style={styles.pageHeader}>3. COVENANTS & OBLIGATIONS</Text>
            <View style={styles.divider} />
            <Text style={styles.bulletItem}>
              • The Tenant shall maintain the property in a clean, sanitary, and tenantable condition.
            </Text>
            <Text style={styles.bulletItem}>
              • Subletting the premises or any part thereof without prior written consent from the Landlord is strictly prohibited.
            </Text>
            <Text style={styles.bulletItem}>
              • Minor repairs resulting from wear and tear are the responsibility of the Tenant, while structural maintenance remains with the Landlord.
            </Text>
            <Text style={styles.bulletItem}>
              • The Tenant agrees to comply with all housing and local community rules.
            </Text>
          </View>
        );
      case 4:
        return (
          <View style={styles.pageTextContent}>
            <Text style={styles.pageHeader}>4. EXECUTION & SIGNATURES</Text>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>
              In witness whereof, the parties have executed this Agreement on the date first above written.
            </Text>

            <View style={styles.signatureGrid}>
              <View style={styles.sigBox}>
                <Text style={styles.sigLabel}>Landlord Signature</Text>
                <View style={styles.sigLine}>
                  <Text style={styles.sigText}>Baye Capital</Text>
                </View>
                <Text style={styles.sigDate}>Date: 26/05/2026</Text>
              </View>

              <View style={styles.sigBox}>
                <Text style={styles.sigLabel}>Tenant Signature</Text>
                <View style={styles.sigLine}>
                  <Text style={styles.sigText}>Saad Bashar</Text>
                </View>
                <Text style={styles.sigDate}>Date: 26/05/2026</Text>
              </View>
            </View>

            {/* Official seal/stamp decoration */}
            <View style={styles.sealContainer}>
              <View style={styles.seal}>
                <SymbolView
                  name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                  size={44}
                  tintColor="#FFA726"
                />
                <Text style={styles.sealText}>BUILDSURE APPROVED</Text>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Top Title/Toolbar */}
          <View style={styles.titleBar}>
            {/* Left side PDF name */}
            <View style={styles.fileNameRow}>
              <SymbolView
                name={{ ios: 'doc.fill', android: 'picture_as_pdf', web: 'picture_as_pdf' }}
                size={16}
                tintColor="#FFA726"
              />
              <Text style={styles.fileNameText} numberOfLines={1}>
                {documentTitle}
              </Text>
            </View>

            {/* Right side Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={handleDownload} style={styles.iconBtn} activeOpacity={0.7}>
                <SymbolView
                  name={{ ios: 'arrow.down.to.line', android: 'download', web: 'download' }}
                  size={18}
                  tintColor="#D87C24"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.iconBtn} activeOpacity={0.7}>
                <SymbolView
                  name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
                  size={18}
                  tintColor="#D87C24"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.iconBtn} activeOpacity={0.7}>
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={18}
                  tintColor="#FFFFFF"
                  weight="bold"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* PDF Page Container */}
          <View style={styles.pageWrapper}>
            <View style={styles.pageOuterBorder}>
              {renderPageContent()}

              {/* Page Nav Arrows overlays */}
              <TouchableOpacity
                onPress={handlePrevPage}
                disabled={activePage === 1}
                style={[styles.navArrow, styles.navArrowLeft, activePage === 1 && styles.navArrowDisabled]}
                activeOpacity={0.8}
              >
                <SymbolView
                  name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
                  size={18}
                  tintColor="#1A1C1E"
                  weight="bold"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextPage}
                disabled={activePage === totalPages}
                style={[styles.navArrow, styles.navArrowRight, activePage === totalPages && styles.navArrowDisabled]}
                activeOpacity={0.8}
              >
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={18}
                  tintColor="#1A1C1E"
                  weight="bold"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Page Pill Counter */}
          <View style={styles.pillCounterContainer}>
            <View style={styles.pillCounter}>
              <Text style={styles.pillText}>
                Page {activePage} / {totalPages}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    height: height * 0.78,
    backgroundColor: '#1E1F21', // Dark frame background
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#303236',
    overflow: 'hidden',
    padding: 16,
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  fileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 12,
  },
  fileNameText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#FFA726',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  pageWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pageOuterBorder: {
    flex: 1,
    position: 'relative',
    padding: 16,
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  navArrowLeft: {
    left: -12,
  },
  navArrowRight: {
    right: -12,
  },
  navArrowDisabled: {
    opacity: 0, // Hide if disabled
  },
  pillCounterContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  pillCounter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1F21',
    borderColor: '#FFA726',
    borderWidth: 1,
  },
  pillText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#FFA726',
    fontWeight: '700',
  },

  /* Page Content Stylings */
  pageCover: {
    flex: 1,
    backgroundColor: '#FEFAF4',
    padding: 12,
    justifyContent: 'space-between',
  },
  coverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coverLogoCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFA726',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverLogoInner: {
    width: 10,
    height: 10,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  coverLogoText: {
    fontFamily: 'Satoshi-Black',
    fontSize: 12,
    fontWeight: '900',
    color: '#1A1C1E',
    letterSpacing: 0.5,
  },
  coverTitleContainer: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  coverTitleText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1C1E',
    lineHeight: 38,
  },
  coverTitleTextAccent: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 32,
    fontWeight: '800',
    color: '#D87C24',
    lineHeight: 38,
  },
  brickContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#E6A140', // Mortar golden yellow color
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    padding: 2,
  },
  brickWall: {
    flex: 1,
  },
  brickRow: {
    flexDirection: 'row',
    height: 14,
    marginBottom: 2,
  },
  brick: {
    flex: 1,
    backgroundColor: '#2C2518', // Brick color
    marginRight: 2,
    borderRadius: 1,
  },
  halfBrick: {
    flex: 0.5,
  },
  brickLabelsRow: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brickLabelText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 8,
    color: '#FFA726',
    fontWeight: '600',
  },

  pageTextContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  pageHeader: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#D87C24',
    fontWeight: '700',
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#EBE6DC',
    marginVertical: 8,
  },
  paragraph: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#1A1C1E',
    lineHeight: 16,
    marginBottom: 12,
  },
  boldText: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
  },
  bulletItem: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#1A1C1E',
    lineHeight: 18,
    marginBottom: 8,
  },
  signatureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  sigBox: {
    flex: 1,
  },
  sigLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 9,
    color: '#6C757D',
    marginBottom: 4,
  },
  sigLine: {
    height: 36,
    borderBottomWidth: 1.5,
    borderBottomColor: '#1A1C1E',
    justifyContent: 'center',
  },
  sigText: {
    fontFamily: 'Satoshi-Italic',
    fontSize: 12,
    color: '#D87C24',
  },
  sigDate: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 8,
    color: '#6C757D',
    marginTop: 4,
  },
  sealContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  seal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FFA726',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sealText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    color: '#FFA726',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
