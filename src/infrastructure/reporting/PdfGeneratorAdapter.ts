/**
 * PDF Generator adapter — wraps react-native-html-to-pdf.
 * Implements IPdfGenerator port.
 * Generates installation reports with embedded photos and GPS data.
 */
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import type { IPdfGenerator } from '../../domain/ports';

export class PdfGeneratorAdapter implements IPdfGenerator {
  async generate(html: string, fileName: string): Promise<string> {
    const result = await RNHTMLtoPDF.convert({
      html,
      fileName: fileName.replace(/[^a-zA-Z0-9_-]/g, '_'),
      directory: 'Documents',
      base64: false,
      height: 841,  // A4 height pt
      width: 595,   // A4 width pt
    });

    if (!result.filePath) {
      throw new Error('PDF generation failed: no file path returned');
    }
    return result.filePath;
  }
}
