import * as CryptoJS from 'crypto-js';

export class EncryptionUtil {
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

  /**
   * Encrypt a string using AES-256
   */
  static encrypt(plaintext: string): string {
    if (!this.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY is not set in environment variables');
    }
    return CryptoJS.AES.encrypt(plaintext, this.ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypt a string using AES-256
   */
  static decrypt(ciphertext: string): string {
    if (!this.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY is not set in environment variables');
    }
    const bytes = CryptoJS.AES.decrypt(ciphertext, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}

