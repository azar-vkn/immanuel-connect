// This file now contains only static configuration data
// All dynamic data (members, families, events, attendance) should be fetched from Firestore

import { DashboardStats, Member } from '@/types';

// Teams - Can be moved to Firestore if you want dynamic team management
export const teams = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'];

// Empty dashboard stats placeholder - Should be calculated from Firestore data
export const getDashboardStats = (): DashboardStats => {
  return {
    totalMembers: 0,
    presentLastEvent: 0,
    birthdaysThisWeek: [],
    anniversariesThisWeek: []
  };
};

// Note: Mock data has been removed. 
// Use the Firestore service (src/services/firestore.ts) to fetch real data.
// 
// Example usage in components:
// 
// import { getMembers, getFamilies, getEvents } from '@/services/firestore';
// 
// const [members, setMembers] = useState<Member[]>([]);
// 
// useEffect(() => {
//   const fetchData = async () => {
//     const data = await getMembers();
//     setMembers(data);
//   };
//   fetchData();
// }, []);
