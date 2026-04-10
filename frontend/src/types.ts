export interface User {
  id: string;
  username: string | null;
  avatar_url: string | null;
  last_seen: string;
}

export interface Room {
  crn: string;
  course_name: string | null;
}

export interface Message {
  id: string;
  room_crn: string;
  user_id: string;
  content: string;
  created_at: string;
  user: User;
  attachments: Attachment[];
  reactions: Reaction[];
  parent_message_id?: string | null;
}

export interface Attachment {
  id: string;
  file_path: string;
  file_name: string;
  file_type: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user?: User;
}
