import React, { useState, useMemo } from 'react';
import { mockMembers } from '@/data/mockData';
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
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  CreditCard,
  Filter
} from 'lucide-react';
import { MemberForm } from '@/components/members/MemberForm';
import { MemberIDCard } from '@/components/members/MemberIDCard';
import { MemberViewDialog } from '@/components/members/MemberViewDialog';
import { toast } from 'sonner';

const Members: React.FC = () => {
  const { hasPermission } = useAuth();
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showIdCard, setShowIdCard] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.phone.includes(query) ||
        m.memberId.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  const canEdit = hasPermission('members.edit');
  const canDelete = hasPermission('members.delete');
  const canCreate = hasPermission('members.create');

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      setMembers(members.filter((m) => m.id !== id));
      toast.success('Member deleted successfully');
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

  const handleSaveEdit = (updatedMember: Member) => {
    setMembers(members.map(m => m.id === updatedMember.id ? updatedMember : m));
    setShowEditDialog(false);
    setSelectedMember(null);
    toast.success('Member updated successfully');
  };

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
                  onSave={(member) => {
                    setMembers([...members, member]);
                    setShowAddModal(false);
                    toast.success('Member added successfully');
                  }}
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
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

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
            {filteredMembers.map((member) => (
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
            ))}
          </TableBody>
        </Table>

        {filteredMembers.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No members found matching your search.
          </div>
        )}
      </div>

      {/* ID Card Dialog */}
      <Dialog open={showIdCard} onOpenChange={setShowIdCard}>
        <DialogContent className="max-w-md glass">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Member ID Card</DialogTitle>
          </DialogHeader>
          {selectedMember && <MemberIDCard member={selectedMember} />}
        </DialogContent>
      </Dialog>

      {/* View Member Dialog */}
      <MemberViewDialog
        member={selectedMember}
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
      />

      {/* Edit Member Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Edit Member</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <MemberForm
              member={selectedMember}
              onSave={handleSaveEdit}
              onCancel={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
