import React, { useState } from 'react';
import { mockFamilies, mockMembers } from '@/data/mockData';
import { Family, Member } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UsersRound, Edit2, Trash2, User, Eye } from 'lucide-react';
import { FamilyViewDialog } from '@/components/families/FamilyViewDialog';
import { FamilyEditDialog } from '@/components/families/FamilyEditDialog';
import { toast } from 'sonner';

const Families: React.FC = () => {
  const { hasPermission } = useAuth();
  const [families, setFamilies] = useState<Family[]>(mockFamilies);
  const [members] = useState<Member[]>(mockMembers);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const canEdit = hasPermission('families.edit');
  const canDelete = hasPermission('families.delete');

  const getFamilyMembers = (memberIds: string[]) => {
    return members.filter(m => memberIds.includes(m.id));
  };

  const handleView = (family: Family) => {
    setSelectedFamily(family);
    setShowViewDialog(true);
  };

  const handleEdit = (family: Family) => {
    setSelectedFamily(family);
    setShowEditDialog(true);
  };

  const handleSaveFamily = (updatedFamily: Family) => {
    setFamilies(families.map(f => f.id === updatedFamily.id ? updatedFamily : f));
    setSelectedFamily(null);
  };

  const handleDelete = (familyId: string) => {
    if (confirm('Are you sure you want to delete this family?')) {
      setFamilies(families.filter(f => f.id !== familyId));
      toast.success('Family deleted successfully');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="font-serif text-3xl font-bold text-gold-gradient">Families</h1>
        <p className="text-muted-foreground">View and manage church families</p>
      </div>

      {/* Families Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {families.map((family, index) => {
          const familyMembers = getFamilyMembers(family.members);
          const headMember = members.find(m => m.id === family.headMemberId);

          return (
            <div
              key={family.id}
              className="glass rounded-xl p-6 card-hover animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <UsersRound className="w-6 h-6" />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleView(family)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-blue-400"
                      onClick={() => handleEdit(family)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(family.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-lg text-foreground mb-2">{family.name}</h3>
              
              {headMember && (
                <p className="text-sm text-muted-foreground mb-4">
                  Head: <span className="text-foreground">{headMember.name}</span>
                </p>
              )}

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Family Members ({familyMembers.length})
                </p>
                {familyMembers.slice(0, 3).map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {member.familyRole || 'Member'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {member.memberId}
                    </Badge>
                  </div>
                ))}
                {familyMembers.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{familyMembers.length - 3} more members
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {families.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <UsersRound className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No families registered yet.</p>
        </div>
      )}

      {/* View Dialog */}
      <FamilyViewDialog
        family={selectedFamily}
        members={members}
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
      />

      {/* Edit Dialog */}
      <FamilyEditDialog
        family={selectedFamily}
        allMembers={members}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleSaveFamily}
      />
    </div>
  );
};

export default Families;
