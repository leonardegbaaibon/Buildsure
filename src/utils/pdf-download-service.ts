import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { CustomAlert } from '@/components/ui/custom-alert';

export interface ContractDownloadOptions {
  filename?: string;
  contractText?: string | null;
  fileUrl?: string;
  propertyTitle?: string;
  unitName?: string;
  tenantName?: string;
  rentAmount?: string | number;
  durationYears?: string | number;
  startDate?: string;
  endDate?: string;
}

interface ContractAssetUris {
  brickBgUri?: string;
  logoIconUri?: string;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateContractHtml(
  options: ContractDownloadOptions,
  assets: ContractAssetUris = {}
): string {
  const {
    contractText,
    propertyTitle = 'Property',
    unitName = 'Unit 1',
    tenantName = 'Tenant',
    rentAmount = '1,270,000',
    durationYears = 1,
    startDate = '17/03/2026',
    endDate = '17/08/2028',
  } = options;

  const { brickBgUri = '', logoIconUri = '' } = assets;

  const formattedRent =
    typeof rentAmount === 'number'
      ? rentAmount.toLocaleString()
      : Number(String(rentAmount).replace(/,/g, '') || 1270000).toLocaleString();

  const formattedText = contractText
    ? escapeHtml(contractText).replace(/\n/g, '<br/>')
    : `
      <p>This Tenancy Agreement is made between the Landlord of <strong>${escapeHtml(propertyTitle)}</strong> and Tenant <strong>${escapeHtml(tenantName)}</strong> for Unit <strong>${escapeHtml(unitName)}</strong>.</p>
      <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #EBE6DC;"><strong>Annual Rent:</strong></td><td style="padding: 8px; border-bottom: 1px solid #EBE6DC;">NGN ${formattedRent}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #EBE6DC;"><strong>Duration:</strong></td><td style="padding: 8px; border-bottom: 1px solid #EBE6DC;">${durationYears} Year(s)</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #EBE6DC;"><strong>Commencement Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #EBE6DC;">${startDate}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #EBE6DC;"><strong>Expiry Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #EBE6DC;">${endDate}</td></tr>
      </table>
      <p>The Tenant agrees to maintain the interior in good repair and abide by the standard estate covenants. The Landlord guarantees quiet enjoyment and payment of all government statutory rates.</p>
    `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Tenancy Agreement</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 210mm;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1A1C1E;
            background: #FFFFFF;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cover-page {
            page-break-after: always;
            page-break-inside: avoid;
            height: 296mm;
            max-height: 296mm;
            width: 210mm;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: #FAF8F5;
          }
          .cover-top-content {
            padding: 35mm 20mm 15mm 20mm;
            background: #FAF8F5;
            z-index: 2;
          }
          .header-brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .brand-logo-img {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            object-fit: contain;
          }
          .brand-logo-fallback {
            width: 32px;
            height: 32px;
            background: #D87C24;
            color: #fff;
            font-weight: 900;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
          }
          .brand-logo-text {
            font-size: 18px;
            font-weight: 900;
            color: #1A1C1E;
            letter-spacing: 2px;
          }
          .main-title-box {
            margin-top: 36px;
          }
          .main-title {
            font-size: 48px;
            font-weight: 900;
            color: #D87C24;
            line-height: 1.05;
            letter-spacing: -0.5px;
          }
          .cover-brick-block {
            height: 155mm;
            width: 100%;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 16mm 20mm;
            background-color: #1A1611;
          }
          .brick-img-full {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
          }
          .brick-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.22);
            z-index: 2;
          }
          .cover-footer-box {
            position: relative;
            z-index: 5;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1.5px solid #9E7134;
            border-radius: 6px;
            padding: 14px 20px;
            background: rgba(15, 12, 8, 0.6);
          }
          .cover-footer-left {
            color: #D87C24;
            font-size: 14px;
            font-weight: 700;
          }
          .cover-footer-right {
            color: #D87C24;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 3px;
          }
          .content-page {
            padding: 20mm;
            page-break-after: auto;
          }
          .doc-header {
            text-align: center;
            border-bottom: 2px solid #D87C24;
            padding-bottom: 14px;
            margin-bottom: 28px;
          }
          .doc-title {
            font-size: 22px;
            font-weight: 800;
            color: #1A1C1E;
            margin: 0;
          }
          .doc-sub {
            font-size: 13px;
            color: #8A8D93;
            margin-top: 6px;
          }
          .doc-body {
            font-size: 14px;
            line-height: 1.85;
            color: #2B2D30;
          }
          .signatures-table {
            width: 100%;
            margin-top: 60px;
            border-collapse: collapse;
          }
          .signatures-table td {
            width: 50%;
            vertical-align: top;
            padding: 24px;
          }
          .sig-line {
            border-top: 1.5px solid #1A1C1E;
            margin-top: 60px;
            padding-top: 10px;
            text-align: center;
            font-weight: bold;
            font-size: 13px;
            color: #1A1C1E;
          }
        </style>
      </head>
      <body>
        <!-- Page 1: Cover Page -->
        <div class="cover-page">
          <div class="cover-top-content">
            <div class="header-brand">
              ${
                logoIconUri
                  ? `<img src="${logoIconUri}" class="brand-logo-img" alt="Logo" />`
                  : `<div class="brand-logo-fallback">BS</div>`
              }
              <div class="brand-logo-text">BUILDSURE</div>
            </div>
            <div class="main-title-box">
              <div class="main-title">TENANCY</div>
              <div class="main-title">AGREEMENT</div>
            </div>
          </div>
          <div class="cover-brick-block">
            ${brickBgUri ? `<img src="${brickBgUri}" class="brick-img-full" alt="Brick Background" />` : ''}
            <div class="brick-overlay"></div>
            <div class="cover-footer-box">
              <div class="cover-footer-left">Buildsure Limited</div>
              <div class="cover-footer-right">W W W . B U I L D S U R E . N G</div>
            </div>
          </div>
        </div>

        <!-- Page 2+: Agreement Terms & Execution -->
        <div class="content-page">
          <div class="doc-header">
            <h1 class="doc-title">TENANCY AGREEMENT</h1>
            <div class="doc-sub">Property: ${escapeHtml(propertyTitle)} (${escapeHtml(unitName)})</div>
          </div>

          <div class="doc-body">
            ${formattedText}
          </div>

          <table class="signatures-table">
            <tr>
              <td>
                <div class="sig-line">Landlord's Signature & Date</div>
              </td>
              <td>
                <div class="sig-line">Tenant's Signature & Date</div>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;
}

/**
 * Downloads or exports any document as a true PDF file
 */
export async function downloadDocumentAsPdf(options: ContractDownloadOptions): Promise<void> {
  const { fileUrl, filename = 'Document.pdf' } = options;

  try {
    const isAvailable = await Sharing.isAvailableAsync();

    // Case 1: Remote file URL (e.g. uploaded receipt PDF or remote storage PDF)
    if (fileUrl && fileUrl.startsWith('http')) {
      const cleanName = filename.endsWith('.pdf')
        ? filename
        : `${filename.replace(/\.[^/.]+$/, '')}.pdf`;

      try {
        const targetFile = new File(Paths.cache, cleanName);
        const downloadedFile = await File.downloadFileAsync(fileUrl, targetFile, { idempotent: true });

        if (isAvailable && downloadedFile.uri) {
          await Sharing.shareAsync(downloadedFile.uri, {
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf',
            dialogTitle: `Download ${cleanName}`,
          });
          return;
        }
      } catch (dlErr) {
        console.warn('[Remote PDF download fallback]', dlErr);
      }
    }

    // Case 2: Generated tenancy contract or text agreement
    let brickBgUri = '';
    let logoIconUri = '';
    try {
      const brickAsset = Asset.fromModule(require('../../assets/images/signup_bg.png'));
      await brickAsset.downloadAsync();
      const brickLocal = brickAsset.localUri || brickAsset.uri;
      if (brickLocal) {
        const base64 = await FileSystemLegacy.readAsStringAsync(brickLocal, { encoding: 'base64' });
        brickBgUri = `data:image/png;base64,${base64}`;
      }

      const logoAsset = Asset.fromModule(require('../../assets/images/icon.png'));
      await logoAsset.downloadAsync();
      const logoLocal = logoAsset.localUri || logoAsset.uri;
      if (logoLocal) {
        const base64 = await FileSystemLegacy.readAsStringAsync(logoLocal, { encoding: 'base64' });
        logoIconUri = `data:image/png;base64,${base64}`;
      }
    } catch (e) {
      console.warn('[Asset base64 load error for PDF export]', e);
    }

    const html = generateContractHtml(options, { brickBgUri, logoIconUri });
    const pdfFile = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const cleanPdfName = filename.endsWith('.pdf')
      ? filename
      : `${filename.replace(/\.[^/.]+$/, '')}.pdf`;

    if (isAvailable) {
      await Sharing.shareAsync(pdfFile.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: `Download ${cleanPdfName}`,
      });
    } else {
      CustomAlert.alert('PDF Ready', `Document generated as ${cleanPdfName}.`);
    }
  } catch (error: any) {
    console.error('[Download PDF Error]', error);
    CustomAlert.alert('Download Error', error.message || 'Failed to generate PDF document.');
  }
}
