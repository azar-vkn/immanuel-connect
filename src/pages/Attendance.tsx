import React, { useState, useMemo } from 'react';
import { mockEvents, mockMembers, mockAttendance } from '@/data/mockData';
import { Attendance as AttendanceType, Member } from '@/types';
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
import { Search, UserCheck, UserX, CheckCircle2, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const Attendance: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [attendance, setAttendance] = useState<AttendanceType[]>(mockAttendance);
  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchPhone, setSearchPhone] = useState('');

  const canMark = hasPermission('attendance.mark');
  const selectedEvent = mockEvents.find(e => e.id === selectedEventId);

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

    return mockMembers.filter(m => {
      if (searchName && m.name.toLowerCase().includes(searchName.toLowerCase())) return true;
      if (searchId && m.memberId.toLowerCase().includes(searchId.toLowerCase())) return true;
      if (searchPhone && m.phone.includes(searchPhone)) return true;
      return false;
    }).slice(0, 10);
  }, [selectedEventId, searchName, searchId, searchPhone]);

  const handleMarkAttendance = (member: Member) => {
    if (markedMemberIds.has(member.id)) {
      toast.info(`${member.name} is already marked present`);
      return;
    }

    const newAttendance: AttendanceType = {
      id: crypto.randomUUID(),
      eventId: selectedEventId,
      memberId: member.id,
      markedAt: new Date().toISOString(),
      markedBy: user?.id || 'unknown'
    };

    setAttendance([...attendance, newAttendance]);
    toast.success(`Marked ${member.name} as present`);
    
    // Clear search fields
    setSearchName('');
    setSearchId('');
    setSearchPhone('');
  };

  const handleRemoveAttendance = (memberId: string) => {
    const member = mockMembers.find(m => m.id === memberId);
    setAttendance(attendance.filter(a => !(a.eventId === selectedEventId && a.memberId === memberId)));
    toast.success(`Removed attendance for ${member?.name}`);
  };

  const presentMembers = mockMembers.filter(m => markedMemberIds.has(m.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="font-serif text-3xl font-bold text-gold-gradient">Attendance</h1>
        <p className="text-muted-foreground">Mark and manage event attendance</p>
      </div>

      {/* Event Selection */}
      <div className="glass rounded-xl p-6 animate-fade-in [animation-delay:100ms]">
        <Label className="text-base font-medium mb-3 block">Select Event</Label>
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="bg-secondary/50 max-w-md">
            <SelectValue placeholder="Choose an event..." />
          </SelectTrigger>
          <SelectContent>
            {mockEvents.map(event => (
              <SelectItem key={event.id} value={event.id}>
                {event.name} - {format(new Date(event.date), 'MMM dd, yyyy')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedEventId && (
        <>
          {/* Search Section */}
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
                      onChange={(e) => {
                        setSearchName(e.target.value);
                        setSearchId('');
                        setSearchPhone('');
                      }}
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
                      onChange={(e) => {
                        setSearchId(e.target.value);
                        setSearchName('');
                        setSearchPhone('');
                      }}
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
                      onChange={(e) => {
                        setSearchPhone(e.target.value);
                        setSearchName('');
                        setSearchId('');
                      }}
                      className="pl-9 bg-secondary/50"
                    />
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border/30">
                  {searchResults.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.memberId} • {member.phone}
                        </p>
                      </div>
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Present Members List */}
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
