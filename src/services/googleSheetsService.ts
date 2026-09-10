import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Profile, Connection, Gender, RelationshipGoal, DatingPreference } from '../types';
import {
  GoogleUser,
  GoogleDriveFile,
  SheetProfileSyncField,
  SheetContactRow,
  SyncPreviewResult
} from '../types/sheets';

// Initialize Firebase
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(firebaseApp);

// Configure Google OAuth provider with Sheets, Drive & Gmail scopes
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://mail.google.com/');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.modify');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.compose');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.labels');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.metadata');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Cache the OAuth access token strictly in memory
let cachedAccessToken: string | null = null;
let cachedGoogleUser: GoogleUser | null = null;
let isSigningIn = false;

// Listeners for Google Auth state changes
type GoogleAuthListener = (user: GoogleUser | null, token: string | null) => void;
const authListeners = new Set<GoogleAuthListener>();

export const onGoogleAuthStateChanged = (listener: GoogleAuthListener): (() => void) => {
  authListeners.add(listener);
  // Immediate fire with current state
  listener(cachedGoogleUser, cachedAccessToken);
  return () => {
    authListeners.delete(listener);
  };
};

const notifyListeners = () => {
  authListeners.forEach((listener) => {
    try {
      listener(cachedGoogleUser, cachedAccessToken);
    } catch (e) {
      console.error('Google Auth listener error:', e);
    }
  });
};

// Monitor Firebase Auth state
onAuthStateChanged(auth, (user: User | null) => {
  if (user && cachedAccessToken) {
    cachedGoogleUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
  } else if (!isSigningIn) {
    cachedAccessToken = null;
    cachedGoogleUser = null;
  }
  notifyListeners();
});

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getGoogleUser = (): GoogleUser | null => {
  return cachedGoogleUser;
};

export const isGoogleConnected = (): boolean => {
  return Boolean(cachedAccessToken && cachedGoogleUser);
};

/**
 * Sign in with Google using popup and capture OAuth Access Token in memory
 */
export const signInWithGoogle = async (): Promise<{ user: GoogleUser; token: string }> => {
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No Google OAuth access token was returned.');
    }

    cachedAccessToken = credential.accessToken;
    const userEmail = (result.user.email || '').toLowerCase().trim();

    // STRICT RBAC: Only administrator Suresh Bohara is permitted Google Workspace integration
    if (userEmail !== 'bohara.suresh8884@gmail.com') {
      await signOut(auth);
      cachedAccessToken = null;
      cachedGoogleUser = null;
      notifyListeners();
      throw new Error('Google Workspace integration is reserved exclusively for system administrator Suresh Bohara.');
    }

    cachedGoogleUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL
    };

    notifyListeners();
    return { user: cachedGoogleUser, token: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Sign out of Google and clear in-memory tokens
 */
export const signOutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedGoogleUser = null;
  notifyListeners();
};

/**
 * Helper to execute authenticated requests to Google APIs
 */
async function fetchGoogleApi<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Google account is not connected. Please sign in with Google first.');
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.error?.message || JSON.stringify(errorJson);
    } catch {
      // ignore
    }
    if (res.status === 401) {
      cachedAccessToken = null;
      notifyListeners();
      throw new Error('Google authorization expired. Please sign in again.');
    }
    throw new Error(`Google API Error (${res.status}): ${errorDetail}`);
  }

  return res.json();
}

/**
 * List the user's existing Google Spreadsheets via Drive API
 */
export const listUserSpreadsheets = async (): Promise<GoogleDriveFile[]> => {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink)');
  const data = await fetchGoogleApi<{ files?: GoogleDriveFile[] }>(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc&pageSize=30`
  );
  return data.files || [];
};

/**
 * Fetch spreadsheet metadata to determine title and available tab names
 */
export const getSpreadsheetMetadata = async (
  spreadsheetId: string
): Promise<{ title: string; sheetNames: string[] }> => {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const data = await fetchGoogleApi<{
    properties?: { title: string };
    sheets?: Array<{ properties?: { title: string } }>;
  }>(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=properties.title,sheets.properties.title`);

  const title = data.properties?.title || 'Untitled Spreadsheet';
  const sheetNames = (data.sheets || []).map((s) => s.properties?.title || 'Sheet1');
  return { title, sheetNames };
};

/**
 * Read cell values from a specified range in a spreadsheet
 */
export const readSheetValues = async (
  spreadsheetId: string,
  range: string
): Promise<string[][]> => {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const encodedRange = encodeURIComponent(range);
  const data = await fetchGoogleApi<{ values?: string[][] }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}`
  );
  return data.values || [];
};

/**
 * Update cell values in a specified range in a spreadsheet
 */
export const writeSheetValues = async (
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean)[][]
): Promise<any> => {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const encodedRange = encodeURIComponent(range);
  return await fetchGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values
      })
    }
  );
};

/**
 * Append rows to a sheet
 */
export const appendSheetValues = async (
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean)[][]
): Promise<any> => {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const encodedRange = encodeURIComponent(range);
  return await fetchGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      body: JSON.stringify({
        values
      })
    }
  );
};

/**
 * Batch update for spreadsheet formatting (headers, tab names, grid properties)
 */
export const batchUpdateSpreadsheet = async (
  spreadsheetId: string,
  requests: any[]
): Promise<any> => {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  return await fetchGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({ requests })
    }
  );
};

/**
 * Extract clean spreadsheet ID from URLs or raw IDs
 */
export const extractSpreadsheetId = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
};

/**
 * Create a new, professionally formatted LoveConnect Data Source Spreadsheet in the user's Drive
 */
export const createLoveConnectSpreadsheet = async (
  currentUser: Profile,
  connections: Connection[],
  allUsers: Profile[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  // 1. Create spreadsheet with two tabs: 'Profile Data' and 'Contacts & Connections'
  const createPayload = {
    properties: {
      title: `LoveConnect - ${currentUser.full_name} Data & Contacts`
    },
    sheets: [
      {
        properties: {
          title: 'Profile Data',
          gridProperties: { rowCount: 50, columnCount: 6, frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Contacts & Connections',
          gridProperties: { rowCount: 100, columnCount: 8, frozenRowCount: 1 }
        }
      }
    ]
  };

  const newSheet = await fetchGoogleApi<{ spreadsheetId: string; spreadsheetUrl?: string }>(
    'https://sheets.googleapis.com/v4/spreadsheets',
    {
      method: 'POST',
      body: JSON.stringify(createPayload)
    }
  );

  const spreadsheetId = newSheet.spreadsheetId;
  const spreadsheetUrl =
    newSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Populate Profile Data tab
  const nowStr = new Date().toISOString().split('T')[0];
  const profileRows = [
    ['Field Key', 'Field Name', 'Current Value', 'Sync Note', 'Last Updated'],
    ['full_name', 'Full Name', currentUser.full_name, 'Display name shown across LoveConnect', nowStr],
    ['bio', 'Bio', currentUser.bio, 'Personal bio & introduction', nowStr],
    ['age', 'Age', currentUser.age, 'Must be 18 or older', nowStr],
    ['gender', 'Gender', currentUser.gender, 'WOMAN, MAN, NON_BINARY, OTHER', nowStr],
    ['location', 'Location / City', currentUser.location, 'Primary city & state/country', nowStr],
    ['neighborhood', 'Neighborhood', currentUser.neighborhood || '', 'Local area / district', nowStr],
    ['profession', 'Profession / Occupation', currentUser.profession || '', 'Job title or career', nowStr],
    ['education', 'Education', currentUser.education || '', 'School or degree', nowStr],
    ['phone', 'Phone Number', currentUser.phone || '', 'Contact phone', nowStr],
    ['email', 'Contact Email', currentUser.email || '', 'Primary email', nowStr],
    ['relationship_goal', 'Relationship Goal', currentUser.relationship_goal, 'LONG_TERM, CASUAL, DATING, FRIENDSHIP, MARRIAGE, NOT_SURE', nowStr],
    ['dating_preference', 'Dating Preference', currentUser.dating_preference, 'MEN, WOMEN, EVERYONE', nowStr],
    ['interests', 'Interests & Hobbies', (currentUser.interests || []).join(', '), 'Comma-separated tags', nowStr],
    ['languages', 'Languages Spoken', (currentUser.languages || []).join(', '), 'Comma-separated languages', nowStr],
    ['zodiac', 'Zodiac Sign', currentUser.zodiac || '', 'Astrological sign', nowStr],
    ['looking_for', 'Looking For', currentUser.looking_for || '', 'What you seek in a partner', nowStr],
    ['height', 'Height', currentUser.height || `${currentUser.height_cm || 175} cm`, 'Height description', nowStr]
  ];

  await writeSheetValues(spreadsheetId, "'Profile Data'!A1:E18", profileRows);

  // 3. Populate Contacts & Connections tab
  const contactRows: (string | number)[][] = [
    ['Name', 'Username', 'Email', 'Phone', 'Connection Status', 'Relationship', 'Connected Since', 'Notes']
  ];

  connections.forEach((conn) => {
    const isRequester = conn.requester_id === currentUser.id;
    const otherUser = isRequester
      ? conn.receiver || allUsers.find((u) => u.id === conn.receiver_id)
      : conn.requester || allUsers.find((u) => u.id === conn.requester_id);

    if (otherUser) {
      contactRows.push([
        otherUser.full_name,
        `@${otherUser.username}`,
        otherUser.email || '',
        otherUser.phone || '',
        conn.status,
        conn.status === 'ACCEPTED' ? 'Mutual Connection' : 'Pending Request',
        new Date(conn.created_at).toLocaleDateString(),
        `Connected via LoveConnect Social Network`
      ]);
    }
  });

  if (contactRows.length === 1) {
    // Add sample placeholder row if user has no connections yet
    contactRows.push([
      'Sample Contact',
      '@sample',
      'sample@loveconnect.com',
      '+1 555 0192',
      'ACCEPTED',
      'Friend',
      nowStr,
      'Example contact row for synchronization'
    ]);
  }

  await writeSheetValues(
    spreadsheetId,
    `'Contacts & Connections'!A1:H${contactRows.length}`,
    contactRows
  );

  return { spreadsheetId, spreadsheetUrl };
};

/**
 * Analyze a spreadsheet and generate a side-by-side preview comparison
 * of what would be updated in the user's profile and contacts.
 */
export const previewSyncFromSpreadsheet = async (
  spreadsheetInput: string,
  currentProfile: Profile
): Promise<SyncPreviewResult> => {
  const spreadsheetId = extractSpreadsheetId(spreadsheetInput);
  if (!spreadsheetId) {
    throw new Error('Please provide a valid Google Sheet ID or URL.');
  }

  const meta = await getSpreadsheetMetadata(spreadsheetId);
  const title = meta.title;

  // Find the profile tab (prefer 'Profile Data', 'Profile', or the first tab)
  const profileTabName =
    meta.sheetNames.find((name) =>
      /profile/i.test(name)
    ) || meta.sheetNames[0];

  const rawValues = await readSheetValues(spreadsheetId, `'${profileTabName}'!A1:Z60`);
  if (!rawValues || rawValues.length === 0) {
    throw new Error(`The sheet "${profileTabName}" is empty.`);
  }

  // Parse fields from key-value or column format
  const parsedValues: Record<string, string> = {};

  // Check if it is formatted as [Field Key, Field Name, Current Value, ...]
  const isKeyValueFormat = rawValues.some(
    (row) =>
      row[0] &&
      /^(full_name|bio|age|location|profession|education|phone|email|interests|gender|relationship_goal|dating_preference|neighborhood|zodiac|looking_for|languages)$/i.test(
        row[0].trim().toLowerCase()
      )
  );

  if (isKeyValueFormat) {
    rawValues.forEach((row) => {
      if (!row || row.length < 2) return;
      const key = (row[0] || '').trim().toLowerCase();
      // If row has 3+ columns, column 2 (index 2) is "Current Value", otherwise column 1
      const val = row.length >= 3 && row[2] !== undefined ? row[2] : row[1] || '';
      if (key) {
        parsedValues[key] = String(val).trim();
      }
    });
  } else {
    // Tabular format where Row 0 is headers, Row 1 is values
    const headers = rawValues[0] || [];
    const values = rawValues[1] || [];
    headers.forEach((header, index) => {
      const cleanHeader = header.trim().toLowerCase().replace(/[\s_-]+/g, '_');
      const val = values[index] !== undefined ? String(values[index]).trim() : '';
      parsedValues[cleanHeader] = val;
    });
  }

  // Map known fields and compare with current profile
  const fieldDefinitions: Array<{
    key: string;
    label: string;
    aliases: string[];
    getCurrent: () => string;
  }> = [
    {
      key: 'full_name',
      label: 'Full Name',
      aliases: ['full_name', 'name', 'fullname'],
      getCurrent: () => currentProfile.full_name || ''
    },
    {
      key: 'bio',
      label: 'Bio / About',
      aliases: ['bio', 'about', 'about_me', 'biography'],
      getCurrent: () => currentProfile.bio || ''
    },
    {
      key: 'age',
      label: 'Age',
      aliases: ['age'],
      getCurrent: () => String(currentProfile.age || '')
    },
    {
      key: 'location',
      label: 'Location / City',
      aliases: ['location', 'city', 'location_/_city'],
      getCurrent: () => currentProfile.location || ''
    },
    {
      key: 'neighborhood',
      label: 'Neighborhood',
      aliases: ['neighborhood', 'district', 'area'],
      getCurrent: () => currentProfile.neighborhood || ''
    },
    {
      key: 'profession',
      label: 'Profession / Job',
      aliases: ['profession', 'job', 'occupation', 'profession_/_occupation'],
      getCurrent: () => currentProfile.profession || ''
    },
    {
      key: 'education',
      label: 'Education',
      aliases: ['education', 'school', 'university'],
      getCurrent: () => currentProfile.education || ''
    },
    {
      key: 'phone',
      label: 'Phone Number',
      aliases: ['phone', 'phone_number', 'contact_phone'],
      getCurrent: () => currentProfile.phone || ''
    },
    {
      key: 'email',
      label: 'Email Address',
      aliases: ['email', 'contact_email', 'email_address'],
      getCurrent: () => currentProfile.email || ''
    },
    {
      key: 'relationship_goal',
      label: 'Relationship Goal',
      aliases: ['relationship_goal', 'goal', 'relationship'],
      getCurrent: () => currentProfile.relationship_goal || ''
    },
    {
      key: 'dating_preference',
      label: 'Dating Preference',
      aliases: ['dating_preference', 'interested_in', 'preference'],
      getCurrent: () => currentProfile.dating_preference || ''
    },
    {
      key: 'interests',
      label: 'Interests & Hobbies',
      aliases: ['interests', 'hobbies', 'interests_&_hobbies'],
      getCurrent: () => (currentProfile.interests || []).join(', ')
    },
    {
      key: 'languages',
      label: 'Languages',
      aliases: ['languages', 'languages_spoken'],
      getCurrent: () => (currentProfile.languages || []).join(', ')
    },
    {
      key: 'zodiac',
      label: 'Zodiac Sign',
      aliases: ['zodiac', 'zodiac_sign', 'astrology'],
      getCurrent: () => currentProfile.zodiac || ''
    },
    {
      key: 'looking_for',
      label: 'Looking For',
      aliases: ['looking_for'],
      getCurrent: () => currentProfile.looking_for || ''
    }
  ];

  const syncFields: SheetProfileSyncField[] = [];
  let hasAnyChange = false;

  fieldDefinitions.forEach((fieldDef) => {
    let matchedVal = '';
    for (const alias of fieldDef.aliases) {
      if (parsedValues[alias] !== undefined && parsedValues[alias] !== '') {
        matchedVal = parsedValues[alias];
        break;
      }
    }

    if (matchedVal !== '') {
      const curVal = fieldDef.getCurrent();
      const isDiff = matchedVal.trim() !== curVal.trim();
      if (isDiff) hasAnyChange = true;

      syncFields.push({
        key: fieldDef.key,
        label: fieldDef.label,
        sheetValue: matchedVal,
        currentValue: curVal,
        isDifferent: isDiff,
        selected: isDiff // default select differences
      });
    }
  });

  // Also check for 'Contacts & Connections' tab
  const contactTabName = meta.sheetNames.find((name) =>
    /contact|connection/i.test(name)
  );

  let contactsList: SheetContactRow[] = [];
  if (contactTabName) {
    try {
      const contactValues = await readSheetValues(spreadsheetId, `'${contactTabName}'!A1:H100`);
      if (contactValues.length > 1) {
        // Skip header row
        for (let i = 1; i < contactValues.length; i++) {
          const r = contactValues[i];
          if (r && r[0]) {
            contactsList.push({
              name: r[0] || '',
              username: r[1] || '',
              email: r[2] || '',
              phone: r[3] || '',
              status: r[4] || 'CONNECTED',
              relationship: r[5] || 'Contact',
              connectedSince: r[6] || '',
              notes: r[7] || ''
            });
          }
        }
      }
    } catch (err) {
      console.warn('Could not read contacts tab:', err);
    }
  }

  return {
    spreadsheetId,
    spreadsheetTitle: title,
    tabName: profileTabName,
    fields: syncFields,
    contacts: contactsList,
    hasChanges: hasAnyChange
  };
};

/**
 * Apply selected sync fields to the user profile
 */
export const applySyncFieldsToProfile = (
  currentProfile: Profile,
  fieldsToApply: SheetProfileSyncField[]
): Partial<Profile> => {
  const updates: any = {};

  fieldsToApply.forEach((field) => {
    if (!field.selected) return;

    const val = field.sheetValue.trim();

    switch (field.key) {
      case 'full_name':
        if (val) updates.full_name = val;
        break;
      case 'bio':
        updates.bio = val;
        break;
      case 'age': {
        const parsedAge = parseInt(val, 10);
        if (!isNaN(parsedAge) && parsedAge >= 18 && parsedAge <= 110) {
          updates.age = parsedAge;
        }
        break;
      }
      case 'gender': {
        const upper = val.toUpperCase();
        if (['WOMAN', 'MAN', 'NON_BINARY', 'OTHER'].includes(upper)) {
          updates.gender = upper as Gender;
        }
        break;
      }
      case 'location':
        if (val) updates.location = val;
        break;
      case 'neighborhood':
        updates.neighborhood = val;
        break;
      case 'profession':
        updates.profession = val;
        break;
      case 'education':
        updates.education = val;
        break;
      case 'phone':
        updates.phone = val;
        break;
      case 'email':
        if (val && val.includes('@')) updates.email = val;
        break;
      case 'relationship_goal': {
        const upper = val.toUpperCase().replace(/\s+/g, '_');
        if (['LONG_TERM', 'CASUAL', 'DATING', 'FRIENDSHIP', 'MARRIAGE', 'NOT_SURE'].includes(upper)) {
          updates.relationship_goal = upper as RelationshipGoal;
        }
        break;
      }
      case 'dating_preference': {
        const upper = val.toUpperCase();
        if (['MEN', 'WOMEN', 'EVERYONE'].includes(upper)) {
          updates.dating_preference = upper as DatingPreference;
        }
        break;
      }
      case 'interests': {
        const list = val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (list.length > 0) {
          updates.interests = list;
        }
        break;
      }
      case 'languages': {
        const list = val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (list.length > 0) {
          updates.languages = list;
        }
        break;
      }
      case 'zodiac':
        updates.zodiac = val;
        break;
      case 'looking_for':
        updates.looking_for = val;
        break;
      default:
        break;
    }
  });

  return updates;
};

/**
 * Export / Push the application's current profile data & contacts into an existing Google Sheet
 */
export const pushAppProfileToSpreadsheet = async (
  spreadsheetId: string,
  profile: Profile,
  connections: Connection[],
  allUsers: Profile[]
): Promise<void> => {
  const meta = await getSpreadsheetMetadata(spreadsheetId);
  const nowStr = new Date().toISOString().split('T')[0];

  // Check if 'Profile Data' tab exists
  const profileTab = meta.sheetNames.find((n) => /profile/i.test(n)) || meta.sheetNames[0];

  const profileRows = [
    ['Field Key', 'Field Name', 'Current Value', 'Sync Note', 'Last Updated'],
    ['full_name', 'Full Name', profile.full_name, 'Display name shown across LoveConnect', nowStr],
    ['bio', 'Bio', profile.bio, 'Personal bio & introduction', nowStr],
    ['age', 'Age', profile.age, 'Must be 18 or older', nowStr],
    ['gender', 'Gender', profile.gender, 'WOMAN, MAN, NON_BINARY, OTHER', nowStr],
    ['location', 'Location / City', profile.location, 'Primary city & state/country', nowStr],
    ['neighborhood', 'Neighborhood', profile.neighborhood || '', 'Local area / district', nowStr],
    ['profession', 'Profession / Occupation', profile.profession || '', 'Job title or career', nowStr],
    ['education', 'Education', profile.education || '', 'School or degree', nowStr],
    ['phone', 'Phone Number', profile.phone || '', 'Contact phone', nowStr],
    ['email', 'Contact Email', profile.email || '', 'Primary email', nowStr],
    ['relationship_goal', 'Relationship Goal', profile.relationship_goal, 'LONG_TERM, CASUAL, DATING, FRIENDSHIP, MARRIAGE, NOT_SURE', nowStr],
    ['dating_preference', 'Dating Preference', profile.dating_preference, 'MEN, WOMEN, EVERYONE', nowStr],
    ['interests', 'Interests & Hobbies', (profile.interests || []).join(', '), 'Comma-separated tags', nowStr],
    ['languages', 'Languages Spoken', (profile.languages || []).join(', '), 'Comma-separated languages', nowStr],
    ['zodiac', 'Zodiac Sign', profile.zodiac || '', 'Astrological sign', nowStr],
    ['looking_for', 'Looking For', profile.looking_for || '', 'What you seek in a partner', nowStr]
  ];

  await writeSheetValues(spreadsheetId, `'${profileTab}'!A1:E17`, profileRows);

  // If there is a Contacts tab or we can write contacts
  const contactsTab = meta.sheetNames.find((n) => /contact|connection/i.test(n));
  if (contactsTab) {
    const contactRows: (string | number)[][] = [
      ['Name', 'Username', 'Email', 'Phone', 'Connection Status', 'Relationship', 'Connected Since', 'Notes']
    ];

    connections.forEach((conn) => {
      const isRequester = conn.requester_id === profile.id;
      const otherUser = isRequester
        ? conn.receiver || allUsers.find((u) => u.id === conn.receiver_id)
        : conn.requester || allUsers.find((u) => u.id === conn.requester_id);

      if (otherUser) {
        contactRows.push([
          otherUser.full_name,
          `@${otherUser.username}`,
          otherUser.email || '',
          otherUser.phone || '',
          conn.status,
          conn.status === 'ACCEPTED' ? 'Mutual Connection' : 'Pending Request',
          new Date(conn.created_at).toLocaleDateString(),
          'Synced from LoveConnect'
        ]);
      }
    });

    await writeSheetValues(
      spreadsheetId,
      `'${contactsTab}'!A1:H${Math.max(2, contactRows.length)}`,
      contactRows
    );
  }
};
