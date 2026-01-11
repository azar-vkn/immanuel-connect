import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { BirthdayCard } from '@/components/dashboard/BirthdayCard';
import { getDashboardStats, mockEvents } from '@/data/mockData';
import { Users, UserCheck, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const stats = getDashboardStats();
  const lastEvent = mockEvents[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="font-serif text-3xl font-bold text-gold-gradient mb-2">
          Welcome, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening at Immanuel AG Church
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Users}
          description="Registered members"
          className="[animation-delay:100ms]"
        />
        <StatCard
          title="Present Last Event"
          value={stats.presentLastEvent}
          icon={UserCheck}
          description={lastEvent ? format(new Date(lastEvent.date), 'MMM dd, yyyy') : 'No events'}
          className="[animation-delay:200ms]"
        />
        <StatCard
          title="Birthdays This Week"
          value={stats.birthdaysThisWeek.length}
          icon={Calendar}
          description="Celebrations ahead"
          className="[animation-delay:300ms]"
        />
        <StatCard
          title="Attendance Rate"
          value={`${Math.round((stats.presentLastEvent / stats.totalMembers) * 100)}%`}
          icon={TrendingUp}
          description="Last event"
          trend={{ value: 5, isPositive: true }}
          className="[animation-delay:400ms]"
        />
      </div>

      {/* Birthday & Anniversary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BirthdayCard 
          members={stats.birthdaysThisWeek} 
          type="birthday" 
        />
        <BirthdayCard 
          members={stats.anniversariesThisWeek} 
          type="anniversary" 
        />
      </div>

      {/* Quick Actions */}
      <div className="glass rounded-xl p-6 animate-fade-in [animation-delay:500ms]">
        <h3 className="font-serif text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction 
            label="Mark Attendance" 
            href="/attendance" 
            color="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          />
          <QuickAction 
            label="Add Member" 
            href="/members" 
            color="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
          />
          <QuickAction 
            label="Create Event" 
            href="/events" 
            color="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
          />
          <QuickAction 
            label="View Reports" 
            href="/reports" 
            color="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
          />
        </div>
      </div>
    </div>
  );
};

const QuickAction: React.FC<{ label: string; href: string; color: string }> = ({ label, href, color }) => (
  <a
    href={href}
    className={`p-4 rounded-lg text-center font-medium transition-all duration-200 ${color}`}
  >
    {label}
  </a>
);

export default Dashboard;
