import { Member, Family, ChurchEvent, Attendance, DashboardStats } from '@/types';
import { addDays, subDays, format } from 'date-fns';

const today = new Date();
const thisWeekStart = subDays(today, today.getDay());

// Mock Members
export const mockMembers: Member[] = [
  {
    id: '1',
    memberId: 'IAG00001',
    name: 'John Abraham',
    dob: format(addDays(thisWeekStart, 2), 'yyyy-MM-dd'),
    gender: 'male',
    phone: '+91 98765 43210',
    address: {
      place: '12, Faith Street',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      pincode: '600001'
    },
    memberType: 'family',
    familyId: 'F001',
    familyRole: 'head',
    maritalStatus: 'married',
    anniversaryDate: format(addDays(thisWeekStart, 4), 'yyyy-MM-dd'),
    baptismStatus: 'baptized',
    baptismDate: '2010-06-15',
    churchRole: 'volunteer',
    team: 'Team A',
    remarks: 'Active member, choir leader',
    createdAt: '2020-01-15',
    updatedAt: '2024-01-10'
  },
  {
    id: '2',
    memberId: 'IAG00001-1',
    name: 'Mary Abraham',
    dob: '1988-08-20',
    gender: 'female',
    phone: '+91 98765 43211',
    address: {
      place: '12, Faith Street',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      pincode: '600001'
    },
    memberType: 'family',
    familyId: 'F001',
    familyRole: 'spouse',
    maritalStatus: 'married',
    anniversaryDate: format(addDays(thisWeekStart, 4), 'yyyy-MM-dd'),
    baptismStatus: 'baptized',
    baptismDate: '2012-03-22',
    churchRole: 'host',
    team: 'Team A',
    createdAt: '2020-01-15',
    updatedAt: '2024-01-10'
  },
  {
    id: '3',
    memberId: 'IAG00002',
    name: 'David Joseph',
    dob: format(addDays(thisWeekStart, 5), 'yyyy-MM-dd'),
    gender: 'male',
    phone: '+91 87654 32109',
    address: {
      place: '45, Grace Avenue',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      pincode: '600020'
    },
    memberType: 'individual',
    maritalStatus: 'single',
    baptismStatus: 'baptized',
    baptismDate: '2018-12-25',
    churchRole: 'operator',
    team: 'Team B',
    createdAt: '2018-06-10',
    updatedAt: '2024-01-05'
  },
  {
    id: '4',
    memberId: 'IAG00003',
    name: 'Sarah Thomas',
    dob: '1992-11-08',
    gender: 'female',
    phone: '+91 76543 21098',
    address: {
      place: '78, Hope Lane',
      city: 'Coimbatore',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      country: 'India',
      pincode: '641001'
    },
    memberType: 'individual',
    maritalStatus: 'single',
    baptismStatus: 'not_baptized',
    churchRole: 'attendee',
    team: 'Team A',
    createdAt: '2023-01-20',
    updatedAt: '2024-01-08'
  },
  {
    id: '5',
    memberId: 'IAG00004',
    name: 'Peter Williams',
    dob: '1975-03-12',
    gender: 'male',
    phone: '+91 65432 10987',
    address: {
      place: '23, Blessing Road',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      pincode: '600015'
    },
    memberType: 'family',
    familyId: 'F002',
    familyRole: 'head',
    maritalStatus: 'married',
    anniversaryDate: '2000-05-20',
    baptismStatus: 'baptized',
    baptismDate: '1995-04-16',
    churchRole: 'volunteer',
    team: 'Team C',
    createdAt: '2015-03-01',
    updatedAt: '2024-01-02'
  }
];

// Mock Families
export const mockFamilies: Family[] = [
  {
    id: 'F001',
    headMemberId: '1',
    name: 'Abraham Family',
    members: ['1', '2'],
    createdAt: '2020-01-15'
  },
  {
    id: 'F002',
    headMemberId: '5',
    name: 'Williams Family',
    members: ['5'],
    createdAt: '2015-03-01'
  }
];

// Mock Events
export const mockEvents: ChurchEvent[] = [
  {
    id: 'E001',
    name: 'Sunday Service',
    date: format(subDays(today, 7), 'yyyy-MM-dd'),
    description: 'Regular Sunday worship service',
    createdAt: format(subDays(today, 14), 'yyyy-MM-dd')
  },
  {
    id: 'E002',
    name: 'Sunday Service',
    date: format(today, 'yyyy-MM-dd'),
    description: 'Regular Sunday worship service',
    createdAt: format(subDays(today, 7), 'yyyy-MM-dd')
  },
  {
    id: 'E003',
    name: 'Prayer Meeting',
    date: format(subDays(today, 3), 'yyyy-MM-dd'),
    description: 'Weekly Wednesday prayer meeting',
    createdAt: format(subDays(today, 10), 'yyyy-MM-dd')
  }
];

// Mock Attendance
export const mockAttendance: Attendance[] = [
  { id: 'A001', eventId: 'E001', memberId: '1', markedAt: mockEvents[0].date, markedBy: 'admin' },
  { id: 'A002', eventId: 'E001', memberId: '2', markedAt: mockEvents[0].date, markedBy: 'admin' },
  { id: 'A003', eventId: 'E001', memberId: '3', markedAt: mockEvents[0].date, markedBy: 'admin' },
  { id: 'A004', eventId: 'E002', memberId: '1', markedAt: mockEvents[1].date, markedBy: 'marker' },
  { id: 'A005', eventId: 'E002', memberId: '4', markedAt: mockEvents[1].date, markedBy: 'marker' },
];

// Dashboard Stats
export const getDashboardStats = (): DashboardStats => {
  const lastEvent = mockEvents[0];
  const lastEventAttendance = mockAttendance.filter(a => a.eventId === lastEvent.id);
  
  const birthdaysThisWeek = mockMembers.filter(m => {
    if (!m.dob) return false;
    const dob = new Date(m.dob);
    const dobThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    const weekEnd = addDays(thisWeekStart, 7);
    return dobThisYear >= thisWeekStart && dobThisYear < weekEnd;
  });

  const anniversariesThisWeek = mockMembers.filter(m => {
    if (!m.anniversaryDate) return false;
    const anniv = new Date(m.anniversaryDate);
    const annivThisYear = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate());
    const weekEnd = addDays(thisWeekStart, 7);
    return annivThisYear >= thisWeekStart && annivThisYear < weekEnd;
  });

  return {
    totalMembers: mockMembers.length,
    presentLastEvent: lastEventAttendance.length,
    birthdaysThisWeek,
    anniversariesThisWeek
  };
};

// Teams
export const teams = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'];
