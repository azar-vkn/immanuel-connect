export type UserRole = 'admin' | 'marker' | 'area_leader';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type MemberStatus = 'regular' | 'long_absent' | 'occasional_visitor';

export type RelationshipType = 'Head' | 'Wife' | 'Husband' | 'Son' | 'Daughter' | 'Father' | 'Mother' | 'Brother' | 'Sister' | 'Other';

export interface Member {
  id: string;
  memberId: string; // IAG00001 (head) or IAG00001-1 (family member) format
  name: string;
  dob: string;
  gender: 'male' | 'female';
  phone: string;
  additionalPhones?: string[];
  address: {
    place: string;
    city: string;
    district: string;
    state: string;
    country: string;
    pincode: string;
  };
  // Family-related fields
  familyId: string; // Base family ID (e.g., IAG00001)
  isHeadOfFamily: boolean;
  relationship: RelationshipType;
  // Legacy field for backward compatibility
  memberType?: 'individual' | 'family';
  familyRole?: 'head' | 'spouse' | 'child' | 'other';
  maritalStatus: 'single' | 'married' | 'widowed' | 'divorced';
  anniversaryDate?: string;
  baptismStatus: 'baptized' | 'not_baptized';
  baptismDate?: string;
  churchRole: 'attendee' | 'volunteer' | 'host' | 'operator';
  team?: string;
  status: MemberStatus;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: string;
  headMemberId: string;
  name: string;
  members: string[]; // Member IDs
  createdAt: string;
}

export interface ChurchEvent {
  id: string;
  name: string;
  date: string;
  description?: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  eventId: string;
  memberId: string;
  markedAt: string;
  markedBy: string;
}

export interface FollowUp {
  id: string;
  memberId: string;
  eventId: string;
  status: 'pending' | 'contacted' | 'unreachable';
  remarks?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DashboardStats {
  totalMembers: number;
  presentLastEvent: number;
  birthdaysThisWeek: Member[];
  anniversariesThisWeek: Member[];
}
