import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Image,
  ImageBackground,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { WebView } from 'react-native-webview';
import { downloadDocumentAsPdf } from '@/utils/pdf-download-service';

export interface DocumentPreviewCardProps {
  filename?: string;
  contractText?: string | null;
  fileUrl?: string;
  mimeType?: string;
  propertyTitle?: string;
  unitName?: string;
  tenantName?: string;
  rentAmount?: string | number;
  durationYears?: string | number;
  startDate?: string;
  endDate?: string;
  onClose?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

function splitContractIntoPages(text: string): { page2: string; page3: string; page4: string } {
  if (!text) return { page2: '', page3: '', page4: '' };

  const lower = text.toLowerCase();
  
  // Landmark 1: Start of covenants / terms
  let split1Idx = -1;
  const split1Matches = [
    'the tenant hereby covenants',
    'the tenant covenants',
    'now this agreement witnesseth as follows',
    'now this agreement witnesseth',
    'it is hereby agreed as follows',
    'terms and conditions',
    'covenants of the tenant',
  ];
  for (const phrase of split1Matches) {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) {
      split1Idx = idx;
      break;
    }
  }

  // Landmark 2: Start of Execution / Signatures / Witness
  let split2Idx = -1;
  const split2Matches = [
    'in witness whereof',
    'signed, sealed and delivered',
    'signed by the landlord',
    'signed by the tenant',
    'signatures & execution',
    'signatures:',
    'in witness of',
  ];
  for (const phrase of split2Matches) {
    const idx = lower.lastIndexOf(phrase);
    if (idx !== -1 && idx > split1Idx) {
      split2Idx = idx;
      break;
    }
  }

  // If semantic splitting found good landmarks:
  if (split1Idx > 60 && split2Idx > split1Idx + 60) {
    return {
      page2: text.slice(0, split1Idx).trim(),
      page3: text.slice(split1Idx, split2Idx).trim(),
      page4: text.slice(split2Idx).trim(),
    };
  }

  // Paragraph/section-based proportional splitting:
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  if (paragraphs.length >= 3) {
    const p1Count = Math.max(1, Math.floor(paragraphs.length / 3));
    const p2Count = Math.max(1, Math.floor((paragraphs.length - p1Count) / 2));
    
    const page2 = paragraphs.slice(0, p1Count).join('\n\n');
    const page3 = paragraphs.slice(p1Count, p1Count + p2Count).join('\n\n');
    const page4 = paragraphs.slice(p1Count + p2Count).join('\n\n');
    return { page2, page3, page4 };
  }

  // Proportional character-based splitting:
  const totalLen = text.length;
  const oneThird = Math.floor(totalLen / 3);
  const twoThirds = Math.floor((totalLen * 2) / 3);

  let break1 = text.indexOf('\n', oneThird);
  if (break1 === -1 || break1 > oneThird + 200) break1 = text.indexOf('. ', oneThird);
  if (break1 === -1 || break1 > oneThird + 200) break1 = oneThird;

  let break2 = text.indexOf('\n', twoThirds);
  if (break2 === -1 || break2 > twoThirds + 200) break2 = text.indexOf('. ', twoThirds);
  if (break2 === -1 || break2 > twoThirds + 200) break2 = twoThirds;

  return {
    page2: text.slice(0, break1).trim(),
    page3: text.slice(break1, break2).trim(),
    page4: text.slice(break2).trim(),
  };
}

const getPdfViewerHtml = (url: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #FAF7F2; display: flex; flex-direction: column; align-items: center; padding: 8px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    .pdf-page { margin-bottom: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.12); border-radius: 4px; background: #fff; width: 100% !important; height: auto !important; }
    #loading { color: #8A8D93; font-size: 13px; padding: 30px; text-align: center; font-family: sans-serif; }
    .spinner { border: 3px solid #EBE6DC; border-top: 3px solid #D87C24; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 10px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="loading"><div class="spinner"></div>Rendering PDF document...</div>
  <div id="pdf-container" style="width: 100%;"></div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const loadingTask = pdfjsLib.getDocument('${url}');
    loadingTask.promise.then(async function(pdf) {
      document.getElementById('loading').style.display = 'none';
      const container = document.getElementById('pdf-container');
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-page';
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        container.appendChild(canvas);
        const renderContext = { canvasContext: canvas.getContext('2d'), viewport: viewport };
        await page.render(renderContext).promise;
      }
    }).catch(function(err) {
      window.location.href = 'https://docs.google.com/viewer?url=' + encodeURIComponent('${url}') + '&embedded=true';
    });
  </script>
</body>
</html>
`;

export function DocumentPreviewCard({
  filename = 'Document_Preview.pdf',
  contractText,
  fileUrl,
  mimeType,
  propertyTitle = 'Property',
  unitName = 'Unit 1',
  tenantName = 'Tenant',
  rentAmount = '1,270,000',
  durationYears = 1,
  startDate = '17/03/2026',
  endDate = '17/08/2028',
  onClose,
  onDownload,
  onShare,
}: DocumentPreviewCardProps) {
  const [previewPage, setPreviewPage] = useState(1);
  const [isImgLoading, setIsImgLoading] = useState(true);
  const [isImgError, setIsImgError] = useState(false);
  const totalPages = 4;

  const resolvedUrl = fileUrl || (typeof contractText === 'string' && contractText.startsWith('http') ? contractText : undefined);

  const isPdf = Boolean(
    (mimeType && mimeType.toLowerCase().includes('pdf')) ||
    (filename && /\.pdf$/i.test(filename.trim())) ||
    (resolvedUrl && /\.pdf($|\?)/i.test(resolvedUrl))
  );

  const isImage = Boolean(
    !isPdf && (
      (mimeType && mimeType.toLowerCase().startsWith('image/')) ||
      (filename && /\.(jpg|jpeg|png|webp|gif|bmp|heic)$/i.test(filename.trim())) ||
      (resolvedUrl && /\.(jpg|jpeg|png|webp|gif|bmp|heic)($|\?)/i.test(resolvedUrl))
    )
  );

  const isPdfUrl = Boolean(
    (isPdf || (!isImage && !contractText)) &&
    resolvedUrl &&
    resolvedUrl.startsWith('http')
  );

  const pdfSourceUri =
    Platform.OS === 'android' && resolvedUrl?.startsWith('http')
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(resolvedUrl)}`
      : resolvedUrl;

  const contractPages = React.useMemo(() => {
    if (!contractText || contractText.startsWith('http')) return null;
    return splitContractIntoPages(contractText);
  }, [contractText]);

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }
    await downloadDocumentAsPdf({
      filename,
      contractText,
      fileUrl: resolvedUrl,
      propertyTitle,
      unitName,
      tenantName,
      rentAmount,
      durationYears,
      startDate,
      endDate,
    });
  };

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }
    await downloadDocumentAsPdf({
      filename,
      contractText,
      fileUrl: resolvedUrl,
      propertyTitle,
      unitName,
      tenantName,
      rentAmount,
      durationYears,
      startDate,
      endDate,
    });
  };

  const formattedRent =
    typeof rentAmount === 'number'
      ? rentAmount.toLocaleString()
      : Number(String(rentAmount).replace(/,/g, '') || 1270000).toLocaleString();

  const getPageTitle = (page: number) => {
    if (page === 2) return 'TENANCY AGREEMENT';
    if (page === 3) return 'COVENANTS & TERMS';
    return 'SIGNATURES & EXECUTION';
  };

  const getPageContent = (page: number) => {
    if (!contractPages) return '';
    if (page === 2) return contractPages.page2;
    if (page === 3) return contractPages.page3;
    return contractPages.page4;
  };

  return (
    <View style={styles.contractCardContainer}>
      {/* File Header Bar */}
      <View style={styles.contractCardHeader}>
        <View style={styles.contractFileTitleRow}>
          <SymbolView
            name={{
              ios: isImage ? 'photo.fill' : 'doc.text.fill',
              android: isImage ? 'image' : 'description',
              web: isImage ? 'image' : 'description',
            }}
            size={16}
            tintColor="#D87C24"
          />
          <Text style={styles.contractFileNameText} numberOfLines={1}>
            {filename}
          </Text>
        </View>

        <View style={styles.contractActionButtonsRow}>
          <TouchableOpacity
            style={styles.contractIconBtn}
            onPress={handleDownload}
            activeOpacity={0.7}
          >
            <SymbolView
              name={{ ios: 'arrow.down.to.line', android: 'download', web: 'download' }}
              size={14}
              tintColor="#D87C24"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contractIconBtn}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <SymbolView
              name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
              size={14}
              tintColor="#D87C24"
            />
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity
              style={styles.contractIconBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={14}
                tintColor="#D87C24"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Document Preview Viewport */}
      <View style={styles.contractPreviewViewport}>
        {resolvedUrl && isImage ? (
          <View style={styles.imageViewerContainer}>
            {isImgLoading && (
              <View style={styles.imageLoadingBox}>
                <ActivityIndicator size="small" color="#D87C24" />
              </View>
            )}
            {isImgError ? (
              <View style={styles.errorContainer}>
                <SymbolView
                  name={{ ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' }}
                  size={32}
                  tintColor="#D87C24"
                />
                <Text style={styles.errorText}>Unable to render image preview</Text>
                <TouchableOpacity
                  style={styles.openExternalBtn}
                  onPress={() => Linking.openURL(resolvedUrl)}
                >
                  <Text style={styles.openExternalBtnText}>Open in Browser ↗</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Image
                source={{ uri: resolvedUrl }}
                style={styles.imagePreview}
                resizeMode="contain"
                onLoadEnd={() => setIsImgLoading(false)}
                onError={() => {
                  setIsImgLoading(false);
                  setIsImgError(true);
                }}
              />
            )}
          </View>
        ) : resolvedUrl && isPdfUrl ? (
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <WebView
              source={{ html: getPdfViewerHtml(resolvedUrl), baseUrl: resolvedUrl }}
              style={{ flex: 1 }}
              startInLoadingState={true}
              originWhitelist={['*']}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              mixedContentMode="always"
              renderLoading={() => (
                <View style={styles.imageLoadingBox}>
                  <ActivityIndicator size="small" color="#D87C24" />
                </View>
              )}
              renderError={() => (
                <View style={styles.errorContainer}>
                  <SymbolView
                    name={{ ios: 'doc.text', android: 'description', web: 'description' }}
                    size={32}
                    tintColor="#D87C24"
                  />
                  <Text style={styles.errorText}>PDF ready for viewing</Text>
                  <TouchableOpacity
                    style={styles.openExternalBtn}
                    onPress={() => Linking.openURL(resolvedUrl)}
                  >
                    <Text style={styles.openExternalBtnText}>Open Document in Browser ↗</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        ) : previewPage === 1 ? (
          <View style={styles.contractCoverPage}>
            <View style={styles.contractCoverTopSection}>
              {/* Logo Header */}
              <View style={styles.contractCoverLogoRow}>
                <Image
                  source={require('../../../assets/images/icon.png')}
                  style={styles.contractLogoIcon}
                  resizeMode="contain"
                />
                <Text style={styles.contractLogoText}>BUILDSURE</Text>
              </View>

              {/* Big Title */}
              <View style={styles.contractCoverTitleContainer}>
                <Text style={styles.contractCoverBigTitle}>TENANCY</Text>
                <Text style={styles.contractCoverBigTitle}>AGREEMENT</Text>
              </View>
            </View>

            {/* Brick Visual Background */}
            <View style={styles.contractCoverVisualBlock}>
              <Image
                source={require('../../../assets/images/signup_bg.png')}
                style={styles.coverBrickAbsoluteImage}
                resizeMode="cover"
              />
              <View style={styles.brickDarkTintOverlay} />

              {/* Footer Brand Border Box */}
              <View style={styles.contractCoverFooterBorderBox}>
                <Text style={styles.contractCoverFooterLeft}>Buildsure Limited</Text>
                <Text style={styles.contractCoverFooterRight}>W W W . B U I L D S U R E . N G</Text>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.contractInnerPageScroll} showsVerticalScrollIndicator={false}>
            {contractPages ? (
              <View style={{ paddingBottom: 24 }}>
                <Text style={styles.docPreviewTitle}>
                  {getPageTitle(previewPage)}
                </Text>
                <Text style={styles.docSub}>
                  Page {previewPage} of {totalPages}
                </Text>
                <Text style={[styles.docParagraph, { color: '#2B2D30', lineHeight: 20, fontSize: 13 }]}>
                  {getPageContent(previewPage)}
                </Text>

                {previewPage === 4 && (
                  <View style={styles.signaturesContainer}>
                    <View style={styles.sigBox}>
                      <View style={styles.sigLine} />
                      <Text style={styles.sigRoleText}>Landlord's Signature</Text>
                    </View>
                    <View style={styles.sigBox}>
                      <View style={styles.sigLine} />
                      <Text style={styles.sigRoleText}>Tenant's Signature</Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View>
                <Text style={styles.docPreviewTitle}>
                  {previewPage === 2
                    ? 'PARTIES & PREMISES'
                    : previewPage === 3
                    ? 'RENT & FINANCIAL TERMS'
                    : 'COVENANTS & SIGNATURES'}
                </Text>
                <Text style={styles.docSub}>
                  Page {previewPage} of {totalPages}
                </Text>
                <Text style={styles.docParagraph}>
                  This agreement is made between the Landlord of {propertyTitle} and Tenant {tenantName} for Unit {unitName}.
                </Text>
                <Text style={styles.docFieldText}>
                  <Text style={styles.docFieldLabel}>Annual Rent:</Text> NGN {formattedRent}
                </Text>
                <Text style={styles.docFieldText}>
                  <Text style={styles.docFieldLabel}>Duration:</Text> {durationYears} Year(s)
                </Text>
                <Text style={styles.docFieldText}>
                  <Text style={styles.docFieldLabel}>Commencement Date:</Text> {startDate}
                </Text>
                <Text style={styles.docFieldText}>
                  <Text style={styles.docFieldLabel}>Expiry Date:</Text> {endDate}
                </Text>
                {previewPage === 4 && (
                  <View style={styles.signaturesContainer}>
                    <View style={styles.sigBox}>
                      <View style={styles.sigLine} />
                      <Text style={styles.sigRoleText}>Landlord's Signature</Text>
                    </View>
                    <View style={styles.sigBox}>
                      <View style={styles.sigLine} />
                      <Text style={styles.sigRoleText}>Tenant's Signature</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        )}

        {/* Left Page Chevron Button (Only for multi-page contract templates) */}
        {!isImage && !isPdfUrl && (
          <>
            <TouchableOpacity
              style={styles.pageArrowLeft}
              onPress={() => setPreviewPage((p) => Math.max(1, p - 1))}
              disabled={previewPage === 1}
              activeOpacity={0.8}
            >
              <SymbolView
                name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
                size={14}
                tintColor={previewPage === 1 ? '#D5D5D5' : '#D87C24'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pageArrowRight}
              onPress={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
              disabled={previewPage === totalPages}
              activeOpacity={0.8}
            >
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={14}
                tintColor={previewPage === totalPages ? '#D5D5D5' : '#D87C24'}
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Page Pill Indicator (Only for multi-page contract templates) */}
      {!isImage && !isPdfUrl && (
        <View style={styles.pageIndicatorBadge}>
          <Text style={styles.pageIndicatorText}>
            Page {previewPage} / {totalPages}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contractCardContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contractCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE6',
    marginBottom: 14,
  },
  contractFileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 6,
  },
  contractFileNameText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#D87C24',
    fontWeight: '700',
    flex: 1,
  },
  contractActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contractIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: '#FFF6E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  contractPreviewViewport: {
    height: 390,
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  contractCoverPage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FAF8F5',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  contractCoverTopSection: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  contractCoverLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contractLogoIcon: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },
  contractLogoText: {
    fontFamily: 'Satoshi-Black',
    fontSize: 13,
    fontWeight: '900',
    color: '#1A1C1E',
    letterSpacing: 1.2,
  },
  contractCoverTitleContainer: {
    marginTop: 14,
  },
  contractCoverBigTitle: {
    fontFamily: 'Satoshi-Black',
    fontSize: 30,
    fontWeight: '900',
    color: '#D87C24',
    lineHeight: 34,
    letterSpacing: 0.5,
  },
  contractCoverVisualBlock: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  coverBrickAbsoluteImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  brickDarkTintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  contractCoverFooterBorderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#9E7134',
    borderRadius: 6,
    backgroundColor: 'rgba(15, 12, 8, 0.7)',
    width: '100%',
  },
  contractCoverFooterLeft: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 9,
    color: '#D87C24',
    fontWeight: '600',
  },
  contractCoverFooterRight: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 7.5,
    color: '#D87C24',
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  contractInnerPageScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  pageArrowLeft: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBE6DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  pageArrowRight: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBE6DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  pageIndicatorBadge: {
    alignSelf: 'center',
    marginTop: 12,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  pageIndicatorText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#D87C24',
    fontWeight: '700',
  },
  docPreviewTitle: {
    fontFamily: 'Satoshi-Black',
    fontSize: 15,
    fontWeight: '900',
    color: '#1A1C1E',
    textAlign: 'center',
    marginBottom: 4,
  },
  docSub: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: '#8A8D93',
    textAlign: 'center',
    marginBottom: 12,
  },
  docParagraph: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 16,
    marginBottom: 10,
  },
  docFieldText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: '#1A1C1E',
    marginBottom: 4,
  },
  docFieldLabel: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    color: '#6C757D',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: '#1A1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageLoadingBox: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  errorContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#8A8D93',
    textAlign: 'center',
  },
  openExternalBtn: {
    backgroundColor: '#D87C24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  openExternalBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5EFE6',
  },
  sigBox: {
    flex: 1,
    alignItems: 'center',
  },
  sigLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#8A8D93',
    marginBottom: 6,
  },
  sigRoleText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: '#8A8D93',
    textAlign: 'center',
  },
});
