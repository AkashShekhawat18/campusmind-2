export type UploadStatus = 'uploading' | 'extracting' | 'ready' | 'error';

export type UploadedFile = { 
  id: string; 
  name: string; 
  size?: number;
  status: UploadStatus;
  document_id?: string;
  error?: string;
  previewUrl?: string;
};

export type Message = { 
  id: string; 
  role: 'user' | 'assistant'; 
  content: string; 
  files?: UploadedFile[];
};

export type ChatSession = { 
  id: string; 
  title: string; 
  messages: Message[]; 
  createdAt?: string; 
};
