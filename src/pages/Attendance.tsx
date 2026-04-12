import React, { useState, useMemo, useEffect } from 'react';
import { getEvents, getMembers, getAttendance, markAttendance, deleteAttendance } from '@/services/firestore';
import { Attendance as AttendanceType, Member, ChurchEvent } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, UserCheck, CheckCircle2, X, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const Attendance: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [markingFamilyId, setMarkingFamilyId] = useState<string | null>(null);

  const canMark = hasPermission('attendance.mark');

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

  const eventAttendance = useMemo(() => {
    return attendance.filter(a => a.eventId === selectedEventId);
  }, [attendance, selectedEventId]);

  const markedMemberIds = useMemo(() => {
    return new Set(eventAttendance.map(a => a.memberId));
  }, [eventAttendance]);

  const searchResults = useMemo(() => {
    if (!selectedEventId) return [];
    const query = searchName.toLowerCase() || searchId.toLowerCase() || searchPhone;
    if (!query) return [];
    return members.filter(m => {
      if (searchName && m.name.toLowerCase().includes(searchName.toLowerCase())) return true;
      if (searchId && m.memberId.toLowerCase().includes(searchId.toLowerCase())) return true;
      if (searchPhone && m.phone.includes(searchPhone)) return true;
      return false;
    }).slice(0, 10);
  }, [selectedEventId, searchName, searchId, searchPhone, members]);

  // Get family members for a given member
  const getFamilyMembers = (member: Member): Member[] => {
    if (!member.familyId) return [];
    return members.filter(m => m.familyId === member.familyId);
  };

  const handleMarkAttendance = async (member: Member) => {
    if (markedMemberIds.has(member.id)) {
      toast.info(`${member.name} is already marked present`);
      return;
    }
    try {
      const newAttendanceData = {
        eventId: selectedEventId,
        memberId: member.id,
        markedAt: new Date().toISOString(),
        markedBy: user?.id || 'unknown'
      };
      const id = await markAttendance(newAttendanceData);
      setAttendance(prev => [...prev, { id, ...newAttendanceData }]);
      toast.success(`Marked ${member.name} as present`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const handleMarkFullFamily = async (member: Member) => {
    const familyMembers = getFamilyMembers(member);
    const unmarked = familyMembers.filter(m => !markedMemberIds.has(m.id));
    if (unmarked.length === 0) {
      toast.info('All family members are already marked present');
      return;
    }
    try {
      const newRecords: AttendanceType[] = [];
      for (const fm of unmarked) {
        const data = {
          eventId: selectedEventId,
          memberId: fm.id,
          markedAt: new Date().toISOString(),
          markedBy: user?.id || 'unknown'
        };
        const id = await markAttendance(data);
        newRecords.push({ id, ...data });
      }
      setAttendance(prev => [...prev, ...newRecords]);
      toast.success(`Marked ${unmarked.length} family member(s) as present`);
    } catch (error) {
      console.error('Error marking family attendance:', error);
      toast.error('Failed to mark family attendance');
    }
  };

  const handleRemoveAttendance = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    const attendanceRecord = attendance.find(a => a.eventId === selectedEventId && a.memberId === memberId);
    if (!attendanceRecord) return;
    try {
      await deleteAttendance(attendanceRecord.id);
      setAttendance(attendance.filter(a => !(a.eventId === selectedEventId && a.memberId === memberId)));
      toast.success(`Removed attendance for ${member?.name}`);
    } catch (error) {
      console.error('Error removing attendance:', error);
      toast.error('Failed to remove attendance');
    }
  };

  const presentMembers = members.filter(m => markedMemberIds.has(m.id));

  const formatAddress = (member: Member) => {
    const parts = [member.address?.place, member.address?.city, member.address?.district].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="font-serif text-3xl font-bold text-gold-gradient">Attendance</h1>
        <p className="text-muted-foreground">Mark and manage event attendance</p>
      </div>

      <div className="glass rounded-xl p-6 animate-fade-in [animation-delay:100ms]">
        <Label className="text-base font-medium mb-3 block">Select Event</Label>
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

      {selectedEventId && (
        <>
          {canMark && (
            <div className="glass rounded-xl p-6 animate-fade-in [animation-delay:200ms]">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Mark Attendance
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="searchName">Search by Name</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="searchName"
                      placeholder="Enter name..."
                      value={searchName}
                      onChange={(e) => { setSearchName(e.target.value); setSearchId(''); setSearchPhone(''); }}
                      className="pl-9 bg-secondary/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="searchId">Search by Member ID</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="searchId"
                      placeholder="e.g., IAG00001"
                      value={searchId}
                      onChange={(e) => { setSearchId(e.target.value); setSearchName(''); setSearchPhone(''); }}
                      className="pl-9 bg-secondary/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="searchPhone">Search by Phone</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="searchPhone"
                      placeholder="Enter phone number..."
                      value={searchPhone}
                      onChange={(e) => { setSearchPhone(e.target.value); setSearchName(''); setSearchId(''); }}
                      className="pl-9 bg-secondary/50"
                    />
                  </div>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border/30">
                  {searchResults.map(member => {
                    const address = formatAddress(member);
                    const familyMembers = getFamilyMembers(member);
                    const hasFamily = familyMembers.length > 1;
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.memberId} • {member.phone}
                          </p>
                          {address && (
                            <p className="text-xs text-muted-foreground mt-0.5">{address}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {markedMemberIds.has(member.id) ? (
                            <Badge className="badge-success">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Present
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleMarkAttendance(member)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Mark Present
                            </Button>
                          )}
                          {hasFamily && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkFullFamily(member)}
                              className="border-primary/50 text-primary hover:bg-primary/10"
                            >
                              <Users className="w-4 h-4 mr-1" />
                              Full Family ({familyMembers.length})
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="glass rounded-xl p-6 animate-fade-in [animation-delay:300ms]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Present Members ({presentMembers.length})
              </h3>
            </div>

            {presentMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No attendance marked yet for this event.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {presentMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.memberId}</p>
                    </div>
                    {canMark && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveAttendance(member.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Attendance;
