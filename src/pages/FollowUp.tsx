import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getMembers, getAttendance, getEvents, getFollowUps, createFollowUp, updateFollowUp } from '@/services/firestore';
import { Member, Attendance, ChurchEvent, FollowUp as FollowUpType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Team } from '@/types/team';
import { TeamManagementDialog } from '@/components/teams/TeamManagementDialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, MessageCircle, CheckCircle2, AlertCircle, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FollowUpStatus {
  [memberId: string]: {
    id?: string; // Firestore document ID for updates
    status: 'pending' | 'contacted' | 'unreachable';
    remarks: string;
  };
}

// Initialize default teams from localStorage or create defaults
const getInitialTeams = (): Team[] => {
  const saved = localStorage.getItem('iag_teams');
  if (saved) {
    return JSON.parse(saved);
  }
  return [
    { id: 'T1', name: 'Team A', leaders: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'T2', name: 'Team B', leaders: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'T3', name: 'Team C', leaders: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'T4', name: 'Team D', leaders: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'T5', name: 'Team E', leaders: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
};

const FollowUp: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus>({});
  const [teams, setTeams] = useState<Team[]>(getInitialTeams);
  const [savingStatus, setSavingStatus] = useState<{ [memberId: string]: boolean }>({});

  const canEdit = hasPermission('followup.edit');
  const isAdmin = user?.role === 'admin';
  const isAreaLeader = user?.role === 'area_leader';

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersData, attendanceData, eventsData, followUpsData] = await Promise.all([
          getMembers(),
          getAttendance(),
          getEvents(),
          getFollowUps()
        ]);
        setMembers(membersData);
        setAttendance(attendanceData);
        setEvents(eventsData);
        setFollowUps(followUpsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Persist teams to localStorage
  useEffect(() => {
    localStorage.setItem('iag_teams', JSON.stringify(teams));
  }, [teams]);

  // Get teams that this user can access
  const accessibleTeams = useMemo(() => {
    if (isAdmin) return teams;
    // Area leaders can only see teams they lead
    if (isAreaLeader && user) {
      return teams.filter(t => t.leaders.includes(user.id));
    }
    return teams;
  }, [teams, isAdmin, isAreaLeader, user]);

  // Auto-select first team for area leaders
  useEffect(() => {
    if (isAreaLeader && accessibleTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(accessibleTeams[0].name);
    }
  }, [isAreaLeader, accessibleTeams, selectedTeam]);

  // Get the last event
  const lastEvent = events[0];

  // Get attendance info for the last event
  const lastEventAttendance = useMemo(() => {
    if (!lastEvent) return new Set<string>();
    return new Set(
      attendance.filter(a => a.eventId === lastEvent.id).map(a => a.memberId)
    );
  }, [lastEvent, attendance]);

  // Initialize followUpStatus from Firestore data for the last event
  useEffect(() => {
    if (!lastEvent) return;
    
    const eventFollowUps = followUps.filter(f => f.eventId === lastEvent.id);
    const statusMap: FollowUpStatus = {};
    
    eventFollowUps.forEach(fu => {
      statusMap[fu.memberId] = {
        id: fu.id,
        status: fu.status,
        remarks: fu.remarks || ''
      };
    });
    
    setFollowUpStatus(statusMap);
  }, [followUps, lastEvent]);

  // Get all team members with their attendance status
  const teamMembersWithStatus = useMemo(() => {
    if (!selectedTeam) return [];
    
    return members
      .filter(m => m.team === selectedTeam)
      .map(member => ({
        ...member,
        isPresent: lastEventAttendance.has(member.id)
      }));
  }, [selectedTeam, lastEventAttendance, members]);

  // For admin: show only absent members (original behavior)
  // For area leaders: show all members with status
  const displayMembers = useMemo(() => {
    if (isAdmin) {
      return teamMembersWithStatus.filter(m => !m.isPresent);
    }
    return teamMembersWithStatus;
  }, [teamMembersWithStatus, isAdmin]);

  const absentCount = teamMembersWithStatus.filter(m => !m.isPresent).length;
  const presentCount = teamMembersWithStatus.filter(m => m.isPresent).length;

  // Save follow-up to Firestore
  const saveFollowUp = useCallback(async (memberId: string, status: 'pending' | 'contacted' | 'unreachable', remarks: string) => {
    if (!lastEvent || !user) return;
    
    setSavingStatus(prev => ({ ...prev, [memberId]: true }));
    
    try {
      const existingFollowUp = followUpStatus[memberId];
      
      if (existingFollowUp?.id) {
        // Update existing follow-up
        await updateFollowUp(existingFollowUp.id, {
          status,
          remarks,
          updatedAt: new Date().toISOString(),
          updatedBy: user.id
        });
      } else {
        // Create new follow-up
        const newId = await createFollowUp({
          memberId,
          eventId: lastEvent.id,
          status,
          remarks,
          updatedAt: new Date().toISOString(),
          updatedBy: user.id
        });
        
        // Update local state with the new ID
        setFollowUpStatus(prev => ({
          ...prev,
          [memberId]: { ...prev[memberId], id: newId }
        }));
      }
      
      toast.success('Follow-up saved');
    } catch (error) {
      console.error('Error saving follow-up:', error);
      toast.error('Failed to save follow-up');
    } finally {
      setSavingStatus(prev => ({ ...prev, [memberId]: false }));
    }
  }, [lastEvent, user, followUpStatus]);

  const updateStatus = useCallback((memberId: string, status: 'pending' | 'contacted' | 'unreachable') => {
    const currentRemarks = followUpStatus[memberId]?.remarks || '';
    
    setFollowUpStatus(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], status, remarks: currentRemarks }
    }));
    
    // Auto-save when status changes
    saveFollowUp(memberId, status, currentRemarks);
  }, [followUpStatus, saveFollowUp]);

  const updateRemarks = useCallback((memberId: string, remarks: string) => {
    const currentStatus = followUpStatus[memberId]?.status || 'pending';
    
    setFollowUpStatus(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], status: currentStatus, remarks }
    }));
  }, [followUpStatus]);

  // Save remarks on blur (when user finishes typing)
  const handleRemarksBlur = useCallback((memberId: string) => {
    const current = followUpStatus[memberId];
    if (current) {
      saveFollowUp(memberId, current.status, current.remarks);
    }
  }, [followUpStatus, saveFollowUp]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'contacted':
        return <Badge className="badge-success"><CheckCircle2 className="w-3 h-3 mr-1" />Contacted</Badge>;
      case 'unreachable':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" />Unreachable</Badge>;
      default:
        return <Badge className="badge-warning"><MessageCircle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getAttendanceBadge = (isPresent: boolean) => {
    if (isPresent) {
      return <Badge className="badge-success"><CheckCircle2 className="w-3 h-3 mr-1" />Present</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" />Absent</Badge>;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gold-gradient">Follow-Up</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Track and follow up with absent members from the last event'
              : 'View your team members and their attendance status'}
          </p>
        </div>
        
        {/* Team Management Button (Admin Only) */}
        {isAdmin && (
          <TeamManagementDialog teams={teams} onTeamsChange={setTeams} />
        )}
      </div>

      {/* Team Selection */}
      <div className="glass rounded-xl p-6 animate-fade-in [animation-delay:100ms]">
        <Label className="text-base font-medium mb-3 block">
          {isAreaLeader ? 'Your Team' : 'Select Team'}
        </Label>
        
        {/* Area Leader with no assigned teams */}
        {isAreaLeader && accessibleTeams.length === 0 ? (
          <div className="text-sm text-muted-foreground bg-secondary/50 rounded-md p-3 max-w-md">
            You are not assigned to any team. Please contact an administrator.
          </div>
        ) : (
          <Select 
            value={selectedTeam} 
            onValueChange={setSelectedTeam}
            disabled={isAreaLeader}
          >
            <SelectTrigger className="bg-secondary/50 max-w-md">
              <SelectValue placeholder={isAreaLeader ? (accessibleTeams[0]?.name || 'No team assigned') : 'Choose a team...'} />
            </SelectTrigger>
            <SelectContent>
              {accessibleTeams.map(team => (
                <SelectItem key={team.id} value={team.name}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Team Stats (for Area Leaders) */}
      {selectedTeam && isAreaLeader && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in [animation-delay:150ms]">
          <div className="glass rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teamMembersWithStatus.length}</p>
              <p className="text-xs text-muted-foreground">Total Members</p>
            </div>
          </div>
          <div className="glass rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{presentCount}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
          </div>
          <div className="glass rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{absentCount}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      {selectedTeam && (
        <div className="space-y-4 animate-fade-in [animation-delay:200ms]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              {isAdmin 
                ? `Absent Members - ${lastEvent?.name || 'No event'} (${displayMembers.length})`
                : `Team Members - ${selectedTeam} (${displayMembers.length})`}
            </h3>
          </div>

          {displayMembers.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-foreground font-medium">
                {isAdmin ? 'Great news!' : 'No members found'}
              </p>
              <p className="text-muted-foreground">
                {isAdmin 
                  ? `All members from ${selectedTeam} were present at the last event.`
                  : `No members are assigned to ${selectedTeam}.`}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {displayMembers.map((member, index) => {
                const memberStatus = followUpStatus[member.id];

                return (
                  <div
                    key={member.id}
                    className={`glass rounded-xl p-6 animate-fade-in ${!member.isPresent ? 'border-l-4 border-l-red-500/50' : ''}`}
                    style={{ animationDelay: `${(index + 3) * 100}ms` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      {/* Member Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{member.name}</h4>
                            <p className="text-sm text-muted-foreground font-mono">{member.memberId}</p>
                          </div>
                          <div className="flex gap-2">
                            {/* Show attendance status for area leaders */}
                            {isAreaLeader && getAttendanceBadge(member.isPresent)}
                            {/* Show follow-up status for admins (only on absent members) */}
                            {isAdmin && getStatusBadge(memberStatus?.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4 text-primary" />
                            <a href={`tel:${member.phone}`} className="hover:text-primary transition-colors">
                              {member.phone}
                            </a>
                          </div>
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4 text-primary mt-0.5" />
                            <span>
                              {member.address.place}, {member.address.city}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Follow-up Actions (Admin only, for absent members) */}
                      {canEdit && isAdmin && !member.isPresent && (
                        <div className="lg:w-80 space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Follow-Up Status</Label>
                            <Select
                              value={memberStatus?.status || 'pending'}
                              onValueChange={(value) => updateStatus(member.id, value as any)}
                            >
                              <SelectTrigger className="bg-secondary/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="unreachable">Unreachable</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Remarks</Label>
                            <Textarea
                              value={memberStatus?.remarks || ''}
                              onChange={(e) => updateRemarks(member.id, e.target.value)}
                              onBlur={() => handleRemarksBlur(member.id)}
                              placeholder="Add notes..."
                              className="bg-secondary/50 resize-none"
                              rows={2}
                              disabled={savingStatus[member.id]}
                            />
                            {savingStatus[member.id] && (
                              <p className="text-xs text-muted-foreground">Saving...</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FollowUp;
