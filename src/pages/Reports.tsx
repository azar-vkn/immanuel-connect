import React, { useState, useMemo, useEffect } from 'react';
import { getEvents, getMembers, getAttendance } from '@/services/firestore';
import { ChurchEvent, Member, Attendance } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileBarChart, Download, Users, UserCheck, UserX, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { FellowshipReport } from '@/components/reports/FellowshipReport';

const Reports: React.FC = () => {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [reportType, setReportType] = useState<'present' | 'absent' | 'all'>('all');

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, membersData, attendanceData] = await Promise.all([
          getEvents(),
          getMembers(),
          getAttendance()
        ]);
        setEvents(eventsData);
        setMembers(membersData);
        setAttendance(attendanceData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const reportData = useMemo(() => {
    if (!selectedEventId) return [];

    const eventAttendanceIds = new Set(
      attendance.filter(a => a.eventId === selectedEventId).map(a => a.memberId)
    );

    switch (reportType) {
      case 'present':
        return members.filter(m => eventAttendanceIds.has(m.id));
      case 'absent':
        return members.filter(m => !eventAttendanceIds.has(m.id));
      default:
        return members.map(m => ({
          ...m,
          isPresent: eventAttendanceIds.has(m.id)
        }));
    }
  }, [selectedEventId, reportType, members, attendance]);

  const handleExport = () => {
    const headers = ['Member ID', 'Name', 'Phone', 'Team', 'Status'];
    const rows = reportData.map(m => [
      m.memberId,
      m.name,
      m.phone,
      m.team || '-',
      reportType === 'all' ? ((m as any).isPresent ? 'Present' : 'Absent') : reportType
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${selectedEvent?.date || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const presentCount = useMemo(() => {
    if (!selectedEventId) return 0;
    return attendance.filter(a => a.eventId === selectedEventId).length;
  }, [selectedEventId, attendance]);

  const absentCount = members.length - presentCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="font-serif text-3xl font-bold text-gold-gradient">Reports</h1>
        <p className="text-muted-foreground">Generate and export attendance reports</p>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-6 animate-fade-in [animation-delay:100ms]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Select Event</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Choose an event..." />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} - {format(new Date(event.date), 'MMM dd, yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    All Members
                  </div>
                </SelectItem>
                <SelectItem value="present">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Present Only
                  </div>
                </SelectItem>
                <SelectItem value="absent">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-400" />
                    Absent Only
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleExport}
              disabled={!selectedEventId}
              className="w-full gap-2 bg-primary hover:bg-primary/90"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {selectedEventId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in [animation-delay:200ms]">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{members.length}</p>
            <p className="text-sm text-muted-foreground">Total Members</p>
          </div>
          <div className="glass rounded-xl p-4 text-center border-emerald-500/30">
            <p className="text-3xl font-bold text-emerald-400">{presentCount}</p>
            <p className="text-sm text-muted-foreground">Present</p>
          </div>
          <div className="glass rounded-xl p-4 text-center border-red-500/30">
            <p className="text-3xl font-bold text-red-400">{absentCount}</p>
            <p className="text-sm text-muted-foreground">Absent</p>
          </div>
        </div>
      )}

      {/* Report Table */}
      {selectedEventId && (
        <div className="glass rounded-xl overflow-hidden animate-fade-in [animation-delay:300ms]">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Member ID</TableHead>
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground">Team</TableHead>
                {reportType === 'all' && (
                  <TableHead className="text-muted-foreground">Status</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((member) => (
                <TableRow key={member.id} className="border-border/30 hover:bg-secondary/30">
                  <TableCell className="font-mono text-sm text-primary">
                    {member.memberId}
                  </TableCell>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">{member.phone}</TableCell>
                  <TableCell>
                    {member.team && (
                      <Badge variant="outline" className="bg-secondary/50">
                        {member.team}
                      </Badge>
                    )}
                  </TableCell>
                  {reportType === 'all' && (
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={(member as any).isPresent ? 'badge-success' : 'bg-red-500/20 text-red-400 border-red-500/30'}
                      >
                        {(member as any).isPresent ? 'Present' : 'Absent'}
                      </Badge>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {reportData.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <FileBarChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              No data to display for the selected filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
