export interface GoogleUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink?: string;
}

export interface SheetProfileSyncField {
  key: string;
  label: string;
  sheetValue: string;
  currentValue: string;
  isDifferent: boolean;
  selected: boolean;
}

export interface SheetContactRow {
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  status?: string;
  relationship?: string;
  connectedSince?: string;
  notes?: string;
}

export interface SyncPreviewResult {
  spreadsheetId: string;
  spreadsheetTitle: string;
  tabName: string;
  fields: SheetProfileSyncField[];
  contacts?: SheetContactRow[];
  hasChanges: boolean;
}
