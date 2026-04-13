import React, { useState, useMemo, useEffect } from 'react';
import { getEvents, getMembers, getAttendance } from '@/services/firestore';
import { transliterateToTamil } from '@/lib/tamilTransliterate';
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

  const formatAddress = (m: Member) => {
    return [m.address?.place, m.address?.city, m.address?.district, m.address?.state].filter(Boolean).join(', ');
  };

  const formatTamilAddress = (m: Member) => {
    const ta = m.tamilAddress;
    const parts = [
      ta?.place || (m.address?.place ? transliterateToTamil(m.address.place) : ''),
      ta?.city || (m.address?.city ? transliterateToTamil(m.address.city) : ''),
      ta?.district || (m.address?.district ? transliterateToTamil(m.address.district) : ''),
      ta?.state || (m.address?.state ? transliterateToTamil(m.address.state) : ''),
    ];
    return parts.filter(Boolean).join(', ');
  };

  const handleExport = () => {
    const headers = ['Member ID', 'Name', 'Tamil Name', 'Phone', 'Address', 'Tamil Address', 'Team', 'Status'];
    const rows = reportData.map(m => [
      m.memberId,
      m.name,
      m.tamilName || transliterateToTamil(m.name),
      m.phone,
      formatAddress(m),
      formatTamilAddress(m),
      m.team || '-',
      reportType === 'all' ? ((m as any).isPresent ? 'Present' : 'Absent') : reportType
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
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

      {/* Event Selector */}
      <div className="glass rounded-xl p-6 animate-fade-in [animation-delay:100ms]">
        <div className="space-y-2">
          <Label>Select Event</Label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="bg-secondary/50 max-w-md">
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
      </div>

      {selectedEventId && (
        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="attendance">Attendance Report</TabsTrigger>
            <TabsTrigger value="fellowship">Fellowship Report</TabsTrigger>
          </TabsList>

          {/* Attendance Report Tab */}
          <TabsContent value="attendance" className="space-y-6">
            {/* Filters */}
            <div className="glass rounded-xl p-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
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

            {/* Report Table */}
            <div className="glass rounded-xl overflow-hidden animate-fade-in">
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
          </TabsContent>

          {/* Fellowship Report Tab */}
          <TabsContent value="fellowship">
            <FellowshipReport
              members={members}
              attendance={attendance}
              selectedEventId={selectedEventId}
              eventName={selectedEvent ? `${selectedEvent.name}-${selectedEvent.date}` : ''}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Reports;
