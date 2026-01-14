import React, { useState, useMemo, useEffect } from 'react';
import { getMembers, createMember, updateMember, deleteMember } from '@/services/firestore';
import { teams } from '@/data/mockData';
import { Member } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Search,
  Plus,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  CreditCard,
  Filter,
  X,
  Loader2
} from 'lucide-react';
import { MemberForm } from '@/components/members/MemberForm';
import { MemberIDCard } from '@/components/members/MemberIDCard';
import { MemberViewDialog } from '@/components/members/MemberViewDialog';
import { toast } from 'sonner';

interface Filters {
  team: string;
  gender: string;
  ageRange: string;
  churchRole: string;
}

const Members: React.FC = () => {
  const { hasPermission } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showIdCard, setShowIdCard] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    team: '',
    gender: '',
    ageRange: '',
    churchRole: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch members from Firestore
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getMembers();
        setMembers(data);
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.error('Failed to load members');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Get unique teams from members or fallback to static teams
  const memberTeams = useMemo(() => {
    const uniqueTeams = new Set(members.map(m => m.team).filter(Boolean));
    return uniqueTeams.size > 0 ? Array.from(uniqueTeams) : teams;
  }, [members]);

  // Calculate age from DOB
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Check if age is in range
  const isInAgeRange = (dob: string, range: string): boolean => {
    if (!range) return true;
    const age = calculateAge(dob);
    switch (range) {
      case '0-12': return age >= 0 && age <= 12;
      case '13-19': return age >= 13 && age <= 19;
      case '20-35': return age >= 20 && age <= 35;
      case '36-50': return age >= 36 && age <= 50;
      case '51-65': return age >= 51 && age <= 65;
      case '65+': return age > 65;
      default: return true;
    }
  };

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(Boolean).length;
  }, [filters]);

  const clearFilters = () => {
    setFilters({ team: '', gender: '', ageRange: '', churchRole: '' });
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          m.name.toLowerCase().includes(query) ||
          m.phone.includes(query) ||
          m.memberId.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Team filter
      if (filters.team && m.team !== filters.team) return false;
      
      // Gender filter
      if (filters.gender && m.gender !== filters.gender) return false;
      
      // Age range filter
      if (filters.ageRange && !isInAgeRange(m.dob, filters.ageRange)) return false;
      
      // Church role filter
      if (filters.churchRole && m.churchRole !== filters.churchRole) return false;
      
      return true;
    });
  }, [members, searchQuery, filters]);

  const canEdit = hasPermission('members.edit');
  const canDelete = hasPermission('members.delete');
  const canCreate = hasPermission('members.create');

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      try {
        await deleteMember(id);
        setMembers(members.filter((m) => m.id !== id));
        toast.success('Member deleted successfully');
      } catch (error) {
        console.error('Error deleting member:', error);
        toast.error('Failed to delete member');
      }
    }
  };

  const handleView = (member: Member) => {
    setSelectedMember(member);
    setShowViewDialog(true);
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async (updatedMember: Member) => {
    try {
      await updateMember(updatedMember.id, updatedMember);
      setMembers(members.map(m => m.id === updatedMember.id ? updatedMember : m));
      setShowEditDialog(false);
      setSelectedMember(null);
      toast.success('Member updated successfully');
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Failed to update member');
    }
  };

  const handleAddMember = async (member: Member) => {
    try {
      const id = await createMember(member);
      setMembers([...members, { ...member, id }]);
      setShowAddModal(false);
      toast.success('Member added successfully');
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gold-gradient">Members</h1>
          <p className="text-muted-foreground">Manage church members and their details</p>
        </div>
        <div className="flex gap-3">
          {hasPermission('members.export') && (
            <>
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Import
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </>
          )}
          {canCreate && (
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">Add New Member</DialogTitle>
                </DialogHeader>
                <MemberForm 
                  onSave={handleAddMember}
                  onCancel={() => setShowAddModal(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass rounded-xl p-4 flex flex-col md:flex-row gap-4 animate-fade-in [animation-delay:100ms]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or member ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 relative">
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 glass" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filter Members</h4>
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
              
              {/* Team Filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Team</Label>
                <Select 
                  value={filters.team} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, team: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {memberTeams.map(team => (
                      <SelectItem key={team} value={team!}>{team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender Filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Gender</Label>
                <Select 
                  value={filters.gender} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="All Genders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Age Range Filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Age Range</Label>
                <Select 
                  value={filters.ageRange} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, ageRange: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="All Ages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ages</SelectItem>
                    <SelectItem value="0-12">Children (0-12)</SelectItem>
                    <SelectItem value="13-19">Teens (13-19)</SelectItem>
                    <SelectItem value="20-35">Young Adults (20-35)</SelectItem>
                    <SelectItem value="36-50">Adults (36-50)</SelectItem>
                    <SelectItem value="51-65">Seniors (51-65)</SelectItem>
                    <SelectItem value="65+">Elders (65+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Church Role Filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Church Role</Label>
                <Select 
                  value={filters.churchRole} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, churchRole: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="attendee">Attendee</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                    <SelectItem value="host">Host</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full" 
                onClick={() => setShowFilters(false)}
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {filters.team && (
            <Badge variant="secondary" className="gap-1 pl-2">
              Team: {filters.team}
              <button onClick={() => setFilters(prev => ({ ...prev, team: '' }))} className="ml-1 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.gender && (
            <Badge variant="secondary" className="gap-1 pl-2">
              Gender: {filters.gender}
              <button onClick={() => setFilters(prev => ({ ...prev, gender: '' }))} className="ml-1 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.ageRange && (
            <Badge variant="secondary" className="gap-1 pl-2">
              Age: {filters.ageRange}
              <button onClick={() => setFilters(prev => ({ ...prev, ageRange: '' }))} className="ml-1 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.churchRole && (
            <Badge variant="secondary" className="gap-1 pl-2">
              Role: {filters.churchRole}
              <button onClick={() => setFilters(prev => ({ ...prev, churchRole: '' }))} className="ml-1 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Members Table */}
      <div className="glass rounded-xl overflow-hidden animate-fade-in [animation-delay:200ms]">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Member ID</TableHead>
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Phone</TableHead>
              <TableHead className="text-muted-foreground">Team</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {members.length === 0 ? 'No members found. Add your first member!' : 'No members match your filters.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
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
                  <TableCell className="capitalize text-muted-foreground">
                    {member.churchRole}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        member.baptismStatus === 'baptized'
                          ? 'badge-success'
                          : 'badge-warning'
                      }
                    >
                      {member.baptismStatus === 'baptized' ? 'Baptized' : 'Not Baptized'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setSelectedMember(member);
                          setShowIdCard(true);
                        }}
                      >
                        <CreditCard className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleView(member)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-400"
                          onClick={() => handleEdit(member)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(member.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ID Card Dialog */}
      <Dialog open={showIdCard} onOpenChange={setShowIdCard}>
        <DialogContent className="max-w-lg glass">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Member ID Card</DialogTitle>
          </DialogHeader>
          {selectedMember && <MemberIDCard member={selectedMember} />}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <MemberViewDialog
        member={selectedMember}
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
      />

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Edit Member</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <MemberForm 
              initialData={selectedMember}
              onSave={handleSaveEdit}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedMember(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
