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
      // Try to load the font from public folder
      const fontData = await this.loadFontData('/fonts/Nikosh.ttf');
      
      if (fontData) {
        // Register the font with jsPDF
        const doc = new jsPDF();
        doc.addFileToVFS('Nikosh.ttf', fontData);
        doc.addFont('Nikosh.ttf', 'Nikosh', 'normal');
        this.fontsLoaded = true;
        this.currentFont = 'Nikosh';
        console.log('✅ Bangla font loaded successfully');
      } else {
        console.warn('⚠️ Bangla font not found, using fallback');
        this.currentFont = 'helvetica';
      }
    } catch (error) {
      console.error('❌ Failed to load Bangla font:', error);
      this.currentFont = 'helvetica';
    }
  }

  /**
   * Load font file as base64
   */
  async loadFontData(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error('Font not found');
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Font load error:', error);
      return null;
    }
  }

  /**
   * Get current font name
   */
  getFont() {
    return this.fontsLoaded ? 'Nikosh' : 'helvetica';
  }

  /**
   * Check if Bangla font is available
   */
  isBanglaAvailable() {
    return this.fontsLoaded;
  }
}

export default new PDFFontService();
