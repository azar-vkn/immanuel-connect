import React, { useMemo } from 'react';
import { Member, Attendance } from '@/types';
import { differenceInYears } from 'date-fns';
import { Users, UserCheck, UserX } from 'lucide-react';

interface FellowshipReportProps {
  members: Member[];
  attendance: Attendance[];
  selectedEventId: string;
}

type FellowshipCategory = 
  | 'Children'
  | 'Youth Boys Fellowship'
  | 'Youth Girls Fellowship'
  | "Men's Fellowship"
  | "Women's Fellowship";

const getCategoryForMember = (member: Member): FellowshipCategory => {
  const age = member.dob ? differenceInYears(new Date(), new Date(member.dob)) : 0;

  if (age < 13) return 'Children';

  const isMarried = member.maritalStatus === 'married';

  if (!isMarried && age < 40) {
    return member.gender === 'male' ? 'Youth Boys Fellowship' : 'Youth Girls Fellowship';
  }

  return member.gender === 'male' ? "Men's Fellowship" : "Women's Fellowship";
};

const CATEGORY_ORDER: FellowshipCategory[] = [
  'Children',
  'Youth Boys Fellowship',
  'Youth Girls Fellowship',
  "Men's Fellowship",
  "Women's Fellowship",
];

const CATEGORY_COLORS: Record<FellowshipCategory, string> = {
  'Children': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Youth Boys Fellowship': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Youth Girls Fellowship': 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  "Men's Fellowship": 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  "Women's Fellowship": 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

export const FellowshipReport: React.FC<FellowshipReportProps> = ({
  members,
  attendance,
  selectedEventId,
}) => {
  const data = useMemo(() => {
    const presentIds = new Set(
      attendance.filter(a => a.eventId === selectedEventId).map(a => a.memberId)
    );

    const categories: Record<FellowshipCategory, { present: Member[]; absent: Member[] }> = {
      'Children': { present: [], absent: [] },
      'Youth Boys Fellowship': { present: [], absent: [] },
      'Youth Girls Fellowship': { present: [], absent: [] },
      "Men's Fellowship": { present: [], absent: [] },
      "Women's Fellowship": { present: [], absent: [] },
    };

    members.forEach(m => {
      const cat = getCategoryForMember(m);
      if (presentIds.has(m.id)) {
        categories[cat].present.push(m);
      } else {
        categories[cat].absent.push(m);
      }
    });

    return categories;
  }, [members, attendance, selectedEventId]);

  const totalPresent = Object.values(data).reduce((s, c) => s + c.present.length, 0);
  const totalAbsent = Object.values(data).reduce((s, c) => s + c.absent.length, 0);

  return (
    <div className="space-y-6 animate-fade-in [animation-delay:200ms]">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{members.length}</p>
          <p className="text-sm text-muted-foreground">Total Members</p>
        </div>
        <div className="glass rounded-xl p-4 text-center border-emerald-500/30">
          <p className="text-3xl font-bold text-emerald-400">{totalPresent}</p>
          <p className="text-sm text-muted-foreground">Present</p>
        </div>
        <div className="glass rounded-xl p-4 text-center border-red-500/30">
          <p className="text-3xl font-bold text-red-400">{totalAbsent}</p>
          <p className="text-sm text-muted-foreground">Absent</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CATEGORY_ORDER.map(cat => {
          const { present, absent } = data[cat];
          const total = present.length + absent.length;
          const pct = total > 0 ? Math.round((present.length / total) * 100) : 0;

          return (
            <div key={cat} className={`glass rounded-xl p-5 border ${CATEGORY_COLORS[cat]}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-semibold text-base">{cat}</h3>
                <span className="text-xs font-medium opacity-80">{total} members</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-secondary/50 mb-4">
                <div
                  className="h-2 rounded-full bg-current transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-lg font-bold text-foreground">{present.length}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UserX className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-lg font-bold text-foreground">{absent.length}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-3 text-right">
                {pct}% attendance
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
