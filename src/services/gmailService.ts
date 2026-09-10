import {
  getAccessToken,
  getGoogleUser,
  isGoogleConnected,
  signInWithGoogle,
  signOutGoogle,
  onGoogleAuthStateChanged
} from './googleSheetsService';
import {
  GmailEmail,
  GmailSendPayload,
  GmailUserProfile,
  GmailListResponse
} from '../types/gmail';

export {
  getAccessToken,
  getGoogleUser,
  isGoogleConnected,
  signInWithGoogle,
  signOutGoogle,
  onGoogleAuthStateChanged
};

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

/**
 * Decode base64url encoded string safely
 */
function decodeBase64Url(data: string): string {
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const binStr = atob(base64);
    return decodeURIComponent(
      binStr
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    try {
      return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

/**
 * Encode string to base64url for RFC 2822 email payload
 */
function encodeBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Helper to make authenticated Gmail API requests
 */
async function fetchGmailApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Please sign in with your Google account to access Gmail.');
  }

  const gUser = getGoogleUser();
  if (gUser && (gUser.email || '').toLowerCase().trim() !== 'bohara.suresh8884@gmail.com') {
    throw new Error('Google Workspace and Gmail access are restricted exclusively to administrator Suresh Bohara.');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${GMAIL_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = `Gmail API error (${response.status}): ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error?.message) {
        message = parsed.error.message;
      }
    } catch {
      if (errorBody) message = errorBody;
    }
    throw new Error(message);
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Fetch Gmail user profile
 */
export async function getGmailUserProfile(): Promise<GmailUserProfile> {
  return fetchGmailApi<GmailUserProfile>('/profile');
}

/**
 * Parse headers and body from Gmail message object
 */
function parseGmailMessage(msgData: any): GmailEmail {
  const headers: Record<string, string> = {};
  if (msgData.payload?.headers) {
    for (const h of msgData.payload.headers) {
      headers[h.name.toLowerCase()] = h.value;
    }
  }

  const fromFull = headers['from'] || 'Unknown Sender';
  let fromName = fromFull;
  let fromEmail = fromFull;

  const emailMatch = fromFull.match(/^(.*?)\s*<([^>]+)>/);
  if (emailMatch) {
    fromName = emailMatch[1].replace(/["']/g, '').trim() || emailMatch[2];
    fromEmail = emailMatch[2].trim();
  }

  const to = headers['to'] || '';
  const subject = headers['subject'] || '(No Subject)';
  const dateStr = headers['date'] || new Date(parseInt(msgData.internalDate || '0', 10)).toLocaleString();

  let bodyText = '';
  let bodyHtml: string | undefined = undefined;

  const extractBody = (part: any) => {
    if (!part) return;
    const mimeType = part.mimeType || '';
    if (mimeType === 'text/plain' && part.body?.data && !bodyText) {
      bodyText = decodeBase64Url(part.body.data);
    } else if (mimeType === 'text/html' && part.body?.data && !bodyHtml) {
      bodyHtml = decodeBase64Url(part.body.data);
    }

    if (part.parts && Array.isArray(part.parts)) {
      for (const subPart of part.parts) {
        extractBody(subPart);
      }
    }
  };

  extractBody(msgData.payload);

  if (!bodyText && msgData.snippet) {
    bodyText = msgData.snippet;
  }

  const labelIds: string[] = msgData.labelIds || [];
  const isUnread = labelIds.includes('UNREAD');
  const isStarred = labelIds.includes('STARRED');
  const isDraft = labelIds.includes('DRAFT');

  return {
    id: msgData.id,
    threadId: msgData.threadId,
    from: fromFull,
    fromName,
    fromEmail,
    to,
    subject,
    date: dateStr,
    snippet: msgData.snippet || '',
    bodyText: bodyText || '(Empty message content)',
    bodyHtml,
    labels: labelIds,
    isUnread,
    isStarred,
    isDraft
  };
}

/**
 * List messages with optional filter query
 */
export async function listGmailMessages(options: {
  query?: string;
  maxResults?: number;
  pageToken?: string;
  labelIds?: string[];
} = {}): Promise<{ messages: GmailEmail[]; nextPageToken?: string; totalEstimate?: number }> {
  const params = new URLSearchParams();
  if (options.maxResults) params.set('maxResults', String(options.maxResults));
  if (options.pageToken) params.set('pageToken', options.pageToken);
  if (options.query) params.set('q', options.query);
  if (options.labelIds && options.labelIds.length > 0) {
    for (const lid of options.labelIds) {
      params.append('labelIds', lid);
    }
  }

  const endpoint = `/messages?${params.toString()}`;
  const listRes = await fetchGmailApi<GmailListResponse>(endpoint);

  if (!listRes.messages || listRes.messages.length === 0) {
    return {
      messages: [],
      nextPageToken: listRes.nextPageToken,
      totalEstimate: listRes.resultSizeEstimate
    };
  }

  // Fetch full details for the retrieved messages in parallel (capped at 15 for responsiveness)
  const detailPromises = listRes.messages.slice(0, 20).map(async (item) => {
    try {
      const msg = await fetchGmailApi<any>(`/messages/${item.id}?format=full`);
      return parseGmailMessage(msg);
    } catch (e) {
      console.warn(`Failed to fetch email detail for ${item.id}:`, e);
      return null;
    }
  });

  const resolved = await Promise.all(detailPromises);
  const emails = resolved.filter((e): e is GmailEmail => e !== null);

  return {
    messages: emails,
    nextPageToken: listRes.nextPageToken,
    totalEstimate: listRes.resultSizeEstimate
  };
}

/**
 * Get single message detail
 */
export async function getGmailMessage(messageId: string): Promise<GmailEmail> {
  const msg = await fetchGmailApi<any>(`/messages/${messageId}?format=full`);
  return parseGmailMessage(msg);
}

/**
 * Send email (RFC 2822 base64url formatted)
 */
export async function sendGmailEmail(payload: GmailSendPayload): Promise<{ id: string; threadId: string }> {
  const user = getGoogleUser();
  const fromEmail = user?.email || 'me';

  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`;

  const headers = [
    `From: ${fromEmail}`,
    `To: ${payload.to}`,
    payload.cc ? `Cc: ${payload.cc}` : null,
    payload.bcc ? `Bcc: ${payload.bcc}` : null,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit'
  ]
    .filter(Boolean)
    .join('\r\n');

  // Convert plain text breaks to HTML if needed
  const formattedHtml = payload.body.includes('<') && payload.body.includes('>')
    ? payload.body
    : payload.body.replace(/\n/g, '<br/>');

  const emailRaw = `${headers}\r\n\r\n${formattedHtml}`;
  const rawBase64 = encodeBase64Url(emailRaw);

  return fetchGmailApi<{ id: string; threadId: string }>('/messages/send', {
    method: 'POST',
    body: JSON.stringify({ raw: rawBase64 })
  });
}

/**
 * Create a draft message
 */
export async function createGmailDraft(payload: GmailSendPayload): Promise<{ id: string; message: any }> {
  const user = getGoogleUser();
  const fromEmail = user?.email || 'me';

  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`;

  const headers = [
    `From: ${fromEmail}`,
    `To: ${payload.to}`,
    payload.cc ? `Cc: ${payload.cc}` : null,
    payload.bcc ? `Bcc: ${payload.bcc}` : null,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8'
  ]
    .filter(Boolean)
    .join('\r\n');

  const formattedHtml = payload.body.includes('<') && payload.body.includes('>')
    ? payload.body
    : payload.body.replace(/\n/g, '<br/>');

  const emailRaw = `${headers}\r\n\r\n${formattedHtml}`;
  const rawBase64 = encodeBase64Url(emailRaw);

  return fetchGmailApi<{ id: string; message: any }>('/drafts', {
    method: 'POST',
    body: JSON.stringify({
      message: {
        raw: rawBase64
      }
    })
  });
}

/**
 * Modify message labels (e.g. mark read/unread, star/unstar)
 */
export async function modifyGmailMessageLabels(
  messageId: string,
  addLabelIds: string[] = [],
  removeLabelIds: string[] = []
): Promise<any> {
  return fetchGmailApi<any>(`/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify({
      addLabelIds,
      removeLabelIds
    })
  });
}

/**
 * Move message to Trash
 */
export async function trashGmailMessage(messageId: string): Promise<any> {
  return fetchGmailApi<any>(`/messages/${messageId}/trash`, {
    method: 'POST'
  });
}

/**
 * Untrash message
 */
export async function untrashGmailMessage(messageId: string): Promise<any> {
  return fetchGmailApi<any>(`/messages/${messageId}/untrash`, {
    method: 'POST'
  });
}

/**
 * Permanently delete message
 */
export async function deleteGmailMessage(messageId: string): Promise<any> {
  return fetchGmailApi<any>(`/messages/${messageId}`, {
    method: 'DELETE'
  });
}
