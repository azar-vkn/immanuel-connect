import React, { useState, useMemo } from 'react';
import { mockMembers, mockAttendance, mockEvents, teams } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
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
import { Phone, MapPin, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FollowUpStatus {
  [memberId: string]: {
    status: 'pending' | 'contacted' | 'unreachable';
    remarks: string;
  };
}

const FollowUp: React.FC = () => {
  const { hasPermission } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus>({});

  const canEdit = hasPermission('followup.edit');

  // Get the last event
  const lastEvent = mockEvents[0];

  // Get members who were absent in the last event
  const absentMembers = useMemo(() => {
    if (!selectedTeam || !lastEvent) return [];

    const lastEventAttendance = mockAttendance.filter(a => a.eventId === lastEvent.id);
    const presentMemberIds = new Set(lastEventAttendance.map(a => a.memberId));

    return mockMembers.filter(
      m => m.team === selectedTeam && !presentMemberIds.has(m.id)
    );
  }, [selectedTeam, lastEvent]);

  const updateStatus = (memberId: string, status: 'pending' | 'contacted' | 'unreachable') => {
    setFollowUpStatus(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], status, remarks: prev[memberId]?.remarks || '' }
    }));
    toast.success('Status updated');
  };

  const updateRemarks = (memberId: string, remarks: string) => {
    setFollowUpStatus(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], status: prev[memberId]?.status || 'pending', remarks }
    }));
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="font-serif text-3xl font-bold text-gold-gradient">Follow-Up</h1>
        <p className="text-muted-foreground">
          Track and follow up with absent members from the last event
        </p>
      </div>

      {/* Team Selection */}
      <div className="glass rounded-xl p-6 animate-fade-in [animation-delay:100ms]">
        <Label className="text-base font-medium mb-3 block">Select Team</Label>
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="bg-secondary/50 max-w-md">
            <SelectValue placeholder="Choose a team..." />
          </SelectTrigger>
          <SelectContent>
            {teams.map(team => (
              <SelectItem key={team} value={team}>
                {team}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Absent Members List */}
      {selectedTeam && (
        <div className="space-y-4 animate-fade-in [animation-delay:200ms]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              Absent Members - {lastEvent?.name} ({absentMembers.length})
            </h3>
          </div>

          {absentMembers.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-foreground font-medium">Great news!</p>
              <p className="text-muted-foreground">All members from {selectedTeam} were present at the last event.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {absentMembers.map((member, index) => {
                const memberStatus = followUpStatus[member.id];

                return (
                  <div
                    key={member.id}
                    className="glass rounded-xl p-6 animate-fade-in"
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
                          {getStatusBadge(memberStatus?.status)}
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

                      {/* Follow-up Actions */}
                      {canEdit && (
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
                              placeholder="Add notes..."
                              className="bg-secondary/50 resize-none"
                              rows={2}
                            />
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
