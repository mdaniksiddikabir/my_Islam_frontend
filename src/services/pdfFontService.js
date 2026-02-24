import { jsPDF } from 'jspdf';

class PDFFontService {
  constructor() {
    this.fontsLoaded = false;
    this.currentFont = 'helvetica';
  }

  /**
   * Register Bangla font with jsPDF
   */
  async registerBanglaFont() {
    try {
      // Use a CDN font that supports Bangla (no local file needed)
      const fontUrl = 'https://fonts.gstatic.com/ea/notosansbengali/v2/NotoSansBengali-Regular.ttf';
      
      const response = await fetch(fontUrl);
      if (!response.ok) throw new Error('Font not found');
      
      const fontArrayBuffer = await response.arrayBuffer();
      const fontBase64 = this.arrayBufferToBase64(fontArrayBuffer);
      
      // Register the font
      const doc = new jsPDF();
      doc.addFileToVFS('NotoSansBengali.ttf', fontBase64);
      doc.addFont('NotoSansBengali.ttf', 'NotoSansBengali', 'normal');
      
      this.fontsLoaded = true;
      this.currentFont = 'NotoSansBengali';
      console.log('✅ Bangla font loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load Bangla font:', error);
      this.currentFont = 'helvetica';
      return false;
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Get current font name
   */
  getFont() {
    return this.currentFont;
  }

  /**
   * Check if Bangla font is available
   */
  isBanglaAvailable() {
    return this.fontsLoaded;
  }
}

export default new PDFFontService();
