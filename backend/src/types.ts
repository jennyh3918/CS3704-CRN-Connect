/**
 * Core User interface
 */
export interface User {
  id: string;
  username: string;
  avatarUrl?: string; // Optional field
  // Created by Codex
  isAdmin?: boolean;
}

/**
 * Group chat structure including Admin roles
 */
export interface Group {
  id: string;
  name: string;
  members: string[]; // Array of User IDs
  admins: string[];  // Array of User IDs who have administrative power
}

/**
 * Payload for the 'remove_member' socket event
 * This ensures the frontend sends the correct data to the backend
 */
export interface RemoveMemberPayload {
  groupId: string;
  memberIdToRemove: string;
  adminId: string;
}

/**
 * Payload for the 'member_removed' broadcast event
 * This is what the server sends back to everyone in the chat
 */
export interface MemberRemovedResponse {
  groupId: string;
  memberIdToRemove: string;
}
