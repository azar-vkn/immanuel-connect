// Firestore Service - CRUD operations for all collections
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member, Family, ChurchEvent, Attendance, FollowUp, User } from '@/types';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  MEMBERS: 'members',
  FAMILIES: 'families',
  EVENTS: 'events',
  ATTENDANCE: 'attendance',
  FOLLOWUPS: 'followups',
  TEAMS: 'teams'
} as const;

// Helper to convert Firestore timestamp to string
const timestampToString = (timestamp: Timestamp | string): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString().split('T')[0];
  }
  return timestamp;
};

// Firestore does not allow `undefined` values. This removes undefined recursively.
const stripUndefined = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stripUndefined).filter(v => v !== undefined);
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      const cleanedValue = stripUndefined(v);
      if (cleanedValue !== undefined) cleaned[k] = cleanedValue;
    }
    return cleaned;
  }
  return value === undefined ? undefined : value;
};

const toFirestoreData = (data: Record<string, unknown>) => stripUndefined(data) as DocumentData;

// ==================== USERS ====================
export const getUser = async (userId: string): Promise<User | null> => {
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as User;
  }
  return null;
};

export const createUser = async (userId: string, userData: Omit<User, 'id'>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(docRef, userData as DocumentData).catch(() => {
    // If document doesn't exist, create it
    addDoc(collection(db, COLLECTIONS.USERS), { ...userData, id: userId });
  });
};

// ==================== MEMBERS ====================
export const getMembers = async (): Promise<Member[]> => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.MEMBERS));
  return querySnapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id, // Always use Firestore document ID, not any stored 'id' field
      createdAt: timestampToString(data.createdAt),
      updatedAt: timestampToString(data.updatedAt)
    } as Member;
  });
};

export const getMember = async (memberId: string): Promise<Member | null> => {
  const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id, // Always use Firestore document ID
      createdAt: timestampToString(data.createdAt),
      updatedAt: timestampToString(data.updatedAt)
    } as Member;
  }
  return null;
};

export const getMemberByMemberId = async (memberId: string): Promise<Member | null> => {
  const q = query(collection(db, COLLECTIONS.MEMBERS), where('memberId', '==', memberId));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id, // Always use Firestore document ID
      createdAt: timestampToString(data.createdAt),
      updatedAt: timestampToString(data.updatedAt)
    } as Member;
  }
  return null;
};

export const createMember = async (memberData: Omit<Member, 'id'>): Promise<string> => {
  const docRef = await addDoc(
    collection(db, COLLECTIONS.MEMBERS),
    toFirestoreData({
      ...memberData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
  );
  return docRef.id;
};
export const updateMember = async (memberId: string, memberData: Partial<Member>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
  await updateDoc(
    docRef,
    toFirestoreData({
      ...memberData,
      updatedAt: Timestamp.now()
    })
  );
};

export const deleteMember = async (memberId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.MEMBERS, memberId));
};

export const getMembersByTeam = async (team: string): Promise<Member[]> => {
  const q = query(collection(db, COLLECTIONS.MEMBERS), where('team', '==', team));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id, // Always use Firestore document ID
      createdAt: timestampToString(data.createdAt),
      updatedAt: timestampToString(data.updatedAt)
    } as Member;
  });
};

// ==================== FAMILIES ====================
export const getFamilies = async (): Promise<Family[]> => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.FAMILIES));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: timestampToString(doc.data().createdAt)
  })) as Family[];
};

export const getFamily = async (familyId: string): Promise<Family | null> => {
  const docRef = doc(db, COLLECTIONS.FAMILIES, familyId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: timestampToString(data.createdAt)
    } as Family;
  }
  return null;
};

export const createFamily = async (familyData: Omit<Family, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.FAMILIES), {
    ...familyData,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const updateFamily = async (familyId: string, familyData: Partial<Family>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.FAMILIES, familyId);
  await updateDoc(docRef, familyData as DocumentData);
};

export const deleteFamily = async (familyId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.FAMILIES, familyId));
};

// ==================== EVENTS ====================
export const getEvents = async (): Promise<ChurchEvent[]> => {
  const q = query(collection(db, COLLECTIONS.EVENTS), orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: timestampToString(doc.data().createdAt)
  })) as ChurchEvent[];
};

export const getEvent = async (eventId: string): Promise<ChurchEvent | null> => {
  const docRef = doc(db, COLLECTIONS.EVENTS, eventId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: timestampToString(data.createdAt)
    } as ChurchEvent;
  }
  return null;
};

export const createEvent = async (eventData: Omit<ChurchEvent, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.EVENTS), {
    ...eventData,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const updateEvent = async (eventId: string, eventData: Partial<ChurchEvent>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.EVENTS, eventId);
  await updateDoc(docRef, eventData as DocumentData);
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.EVENTS, eventId));
};

// ==================== ATTENDANCE ====================
export const getAttendance = async (): Promise<Attendance[]> => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.ATTENDANCE));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Attendance[];
};

export const getAttendanceByEvent = async (eventId: string): Promise<Attendance[]> => {
  const q = query(collection(db, COLLECTIONS.ATTENDANCE), where('eventId', '==', eventId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Attendance[];
};

export const getAttendanceByMember = async (memberId: string): Promise<Attendance[]> => {
  const q = query(collection(db, COLLECTIONS.ATTENDANCE), where('memberId', '==', memberId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Attendance[];
};

export const markAttendance = async (attendanceData: Omit<Attendance, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.ATTENDANCE), attendanceData);
  return docRef.id;
};

export const deleteAttendance = async (attendanceId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.ATTENDANCE, attendanceId));
};

// ==================== FOLLOW-UPS ====================
export const getFollowUps = async (): Promise<FollowUp[]> => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.FOLLOWUPS));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FollowUp[];
};

export const getFollowUpsByEvent = async (eventId: string): Promise<FollowUp[]> => {
  const q = query(collection(db, COLLECTIONS.FOLLOWUPS), where('eventId', '==', eventId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FollowUp[];
};

export const createFollowUp = async (followUpData: Omit<FollowUp, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.FOLLOWUPS), followUpData);
  return docRef.id;
};

export const updateFollowUp = async (followUpId: string, followUpData: Partial<FollowUp>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.FOLLOWUPS, followUpId);
  await updateDoc(docRef, followUpData as DocumentData);
};

// ==================== TEAMS ====================
export const getTeams = async (): Promise<string[]> => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.TEAMS));
  return querySnapshot.docs.map(doc => doc.data().name as string);
};

export const createTeam = async (teamName: string): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.TEAMS), { name: teamName });
  return docRef.id;
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.TEAMS, teamId));
};
