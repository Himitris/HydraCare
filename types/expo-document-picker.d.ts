// types/expo-document-picker.d.ts
declare module 'expo-document-picker' {
  export interface DocumentPickerAsset {
    uri: string;
    name: string;
    size: number;
    mimeType: string;
  }

  export interface DocumentPickerResult {
    type: 'success' | 'cancel';
    uri?: string;
    name?: string;
    size?: number;
    mimeType?: string;
    lastModified?: number;
    file?: File;
    output?: DocumentPickerAsset[];
    canceled: boolean;
    assets?: DocumentPickerAsset[];
  }

  export interface DocumentPickerOptions {
    type?: string | string[];
    copyToCacheDirectory?: boolean;
    multiple?: boolean;
  }

  export function getDocumentAsync(
    options?: DocumentPickerOptions
  ): Promise<DocumentPickerResult>;
}
