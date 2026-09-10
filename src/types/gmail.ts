export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailEmail {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  bodyText: string;
  bodyHtml?: string;
  labels: string[];
  isUnread: boolean;
  isStarred: boolean;
  isDraft?: boolean;
}

export interface GmailSendPayload {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export interface GmailUserProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}
