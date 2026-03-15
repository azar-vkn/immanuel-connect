import React, { useState, useEffect, useMemo } from 'react';
import { Member, MemberStatus, RelationshipType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { teams } from '@/data/mockData';
import { getMembers } from '@/services/firestore';
import { Search } from 'lucide-react';

interface MemberFormProps {
  member?: Member;
  onSave: (member: Member) => void;
  onCancel: () => void;
}

type MemberCategory = 'new_family_head' | 'existing_family_member';

const RELATIONSHIP_OPTIONS: RelationshipType[] = [
  'Head', 'Wife', 'Husband', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Other'
];

export const MemberForm: React.FC<MemberFormProps> = ({ member, onSave, onCancel }) => {
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [memberCategory, setMemberCategory] = useState<MemberCategory>('new_family_head');
  const [selectedFamilyHead, setSelectedFamilyHead] = useState<Member | null>(null);
  const [familyHeadSearch, setFamilyHeadSearch] = useState('');
  const [showFamilyHeadDropdown, setShowFamilyHeadDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: member?.name || '',
    tamilName: member?.tamilName || '',
    dob: member?.dob || '',
    gender: member?.gender || 'male',
    phone: member?.phone || '',
    place: member?.address?.place || '',
    city: member?.address?.city || '',
    district: member?.address?.district || '',
    state: member?.address?.state || '',
    country: member?.address?.country || 'India',
    pincode: member?.address?.pincode || '',
    tamilPlace: member?.tamilAddress?.place || '',
    tamilCity: member?.tamilAddress?.city || '',
    tamilDistrict: member?.tamilAddress?.district || '',
    tamilState: member?.tamilAddress?.state || '',
    relationship: (member?.relationship || 'Head') as RelationshipType,
    maritalStatus: member?.maritalStatus || 'single',
    anniversaryDate: member?.anniversaryDate || '',
    baptismStatus: member?.baptismStatus || 'not_baptized',
    baptismDate: member?.baptismDate || '',
    churchRole: member?.churchRole || 'attendee',
    team: member?.team || '',
    status: member?.status || 'regular',
    remarks: member?.remarks || '',
  });

  const [nextBaseMemberId, setNextBaseMemberId] = useState<string>('IAG00001');

  // Fetch all members for family head selection and ID generation
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const existingMembers = await getMembers();
        setAllMembers(existingMembers);
        
        if (!member) {
          // Calculate next base member ID for new family heads
          const baseNumbers = existingMembers
            .map(m => {
              // Extract base number from either IAG00001 or IAG00001-1 format
              const match = m.memberId?.match(/^IAG(\d+)/);
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => !isNaN(n));
          
          const maxNumber = baseNumbers.length > 0 ? Math.max(...baseNumbers) : 0;
          const nextNumber = maxNumber + 1;
          setNextBaseMemberId(`IAG${nextNumber.toString().padStart(5, '0')}`);
        }
      } catch (error) {
        console.error('Error fetching members for ID generation:', error);
        setNextBaseMemberId('IAG00001');
      }
    };
    fetchMembers();
  }, [member]);

  // Get all family heads for selection
  const familyHeads = useMemo(() => {
    return allMembers.filter(m => m.isHeadOfFamily);
  }, [allMembers]);

  // Filter family heads based on search
  const filteredFamilyHeads = useMemo(() => {
    if (!familyHeadSearch.trim()) return familyHeads;
    const query = familyHeadSearch.toLowerCase();
    return familyHeads.filter(h => 
      h.name.toLowerCase().includes(query) || 
      h.memberId.toLowerCase().includes(query)
    );
  }, [familyHeads, familyHeadSearch]);

  // Generate next member ID for existing family
  const getNextFamilyMemberId = (familyId: string): string => {
    const familyMembers = allMembers.filter(m => m.familyId === familyId && !m.isHeadOfFamily);
    const memberNumbers = familyMembers
      .map(m => {
        const match = m.memberId?.match(/-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    
    const maxNumber = memberNumbers.length > 0 ? Math.max(...memberNumbers) : 0;
    return `${familyId}-${maxNumber + 1}`;
  };

  // Pre-fill address when selecting a family head
  useEffect(() => {
    if (selectedFamilyHead && memberCategory === 'existing_family_member') {
      setFormData(prev => ({
        ...prev,
        place: selectedFamilyHead.address?.place || prev.place,
        city: selectedFamilyHead.address?.city || prev.city,
        district: selectedFamilyHead.address?.district || prev.district,
        state: selectedFamilyHead.address?.state || prev.state,
        country: selectedFamilyHead.address?.country || prev.country,
        pincode: selectedFamilyHead.address?.pincode || prev.pincode,
      }));
    }
  }, [selectedFamilyHead, memberCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let memberId: string;
    let familyId: string;
    let isHeadOfFamily: boolean;
    let relationship: RelationshipType;

    if (member) {
      // Editing existing member - preserve IDs
      memberId = member.memberId;
      // For backward compatibility: if familyId is missing, use memberId as familyId
      familyId = member.familyId || member.memberId;
      // For backward compatibility: if isHeadOfFamily is missing, assume true if no dash in memberId
      isHeadOfFamily = member.isHeadOfFamily ?? !member.memberId.includes('-');
      relationship = formData.relationship;
    } else if (memberCategory === 'new_family_head') {
      // New family head
      memberId = nextBaseMemberId;
      familyId = nextBaseMemberId;
      isHeadOfFamily = true;
      relationship = 'Head';
    } else {
      // Existing family member
      if (!selectedFamilyHead) {
        return; // Should not happen due to form validation
      }
      familyId = selectedFamilyHead.familyId || selectedFamilyHead.memberId;
      memberId = getNextFamilyMemberId(familyId);
      isHeadOfFamily = false;
      relationship = formData.relationship;
    }

    const newMember: Member = {
      id: member?.id || crypto.randomUUID(),
      memberId,
      name: formData.name,
      tamilName: formData.tamilName || undefined,
      dob: formData.dob,
      gender: formData.gender as 'male' | 'female',
      phone: formData.phone,
      address: {
        place: formData.place,
        city: formData.city,
        district: formData.district,
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode,
      },
      tamilAddress: (formData.tamilPlace || formData.tamilCity || formData.tamilDistrict || formData.tamilState) ? {
        place: formData.tamilPlace || undefined,
        city: formData.tamilCity || undefined,
        district: formData.tamilDistrict || undefined,
        state: formData.tamilState || undefined,
      } : undefined,
      familyId,
      isHeadOfFamily,
      relationship,
      maritalStatus: formData.maritalStatus as Member['maritalStatus'],
      anniversaryDate: formData.anniversaryDate || undefined,
      baptismStatus: formData.baptismStatus as 'baptized' | 'not_baptized',
      baptismDate: formData.baptismDate || undefined,
      churchRole: formData.churchRole as Member['churchRole'],
      team: formData.team || undefined,
      status: formData.status as MemberStatus,
      remarks: formData.remarks || undefined,
      createdAt: member?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newMember);
  };

  const isEditMode = !!member;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Member Category - Only show when adding new member */}
      {!isEditMode && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground border-b border-border/50 pb-2">
            Member Category
          </h3>
          <RadioGroup
            value={memberCategory}
            onValueChange={(value: MemberCategory) => {
              setMemberCategory(value);
              setSelectedFamilyHead(null);
              setFamilyHeadSearch('');
              if (value === 'new_family_head') {
                setFormData(prev => ({ ...prev, relationship: 'Head' }));
              } else {
                setFormData(prev => ({ ...prev, relationship: 'Wife' }));
              }
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 cursor-pointer">
              <RadioGroupItem value="new_family_head" id="new_family_head" />
              <Label htmlFor="new_family_head" className="cursor-pointer flex-1">
                <span className="font-medium">New Family (Head)</span>
                <p className="text-sm text-muted-foreground">Create a new family with this member as the head</p>
                {memberCategory === 'new_family_head' && (
                  <span className="text-xs text-primary mt-1 block">
                    Member ID will be: {nextBaseMemberId}
                  </span>
                )}
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 cursor-pointer">
              <RadioGroupItem value="existing_family_member" id="existing_family_member" />
              <Label htmlFor="existing_family_member" className="cursor-pointer flex-1">
                <span className="font-medium">Existing Family Member</span>
                <p className="text-sm text-muted-foreground">Add this member to an existing family</p>
              </Label>
            </div>
          </RadioGroup>

          {/* Family Head Selection - Only show when adding to existing family */}
          {memberCategory === 'existing_family_member' && (
            <div className="space-y-2">
              <Label>Select Family Head *</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or member ID..."
                    value={familyHeadSearch}
                    onChange={(e) => {
                      setFamilyHeadSearch(e.target.value);
                      setShowFamilyHeadDropdown(true);
                    }}
                    onFocus={() => setShowFamilyHeadDropdown(true)}
                    className="pl-10 bg-secondary/50"
                  />
                </div>
                {showFamilyHeadDropdown && filteredFamilyHeads.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredFamilyHeads.map((head) => (
                      <button
                        key={head.id}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-secondary/50 flex justify-between items-center"
                        onClick={() => {
                          setSelectedFamilyHead(head);
                          setFamilyHeadSearch(head.name);
                          setShowFamilyHeadDropdown(false);
                        }}
                      >
                        <span>{head.name}</span>
                        <span className="text-xs text-muted-foreground">{head.memberId}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedFamilyHead && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm">
                    <span className="font-medium">Selected Family:</span> {selectedFamilyHead.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Family ID: {selectedFamilyHead.familyId} • 
                    New Member ID will be: {getNextFamilyMemberId(selectedFamilyHead.familyId)}
                  </p>
                </div>
              )}
              {familyHeads.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No family heads found. Please add a family head first.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Relationship - Show when editing or adding to existing family */}
      {(isEditMode || memberCategory === 'existing_family_member') && (
        <div className="space-y-2">
          <Label htmlFor="relationship">Relationship to Family Head *</Label>
          <Select
            value={formData.relationship}
            onValueChange={(value: RelationshipType) => setFormData({ ...formData, relationship: value })}
            disabled={isEditMode && member?.isHeadOfFamily}
          >
            <SelectTrigger className="bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIP_OPTIONS.filter(r => 
                isEditMode && member?.isHeadOfFamily ? r === 'Head' : r !== 'Head'
              ).map((rel) => (
                <SelectItem key={rel} value={rel}>{rel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Personal Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground border-b border-border/50 pb-2">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-secondary/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tamilName">பெயர் (Tamil Name)</Label>
            <Input
              id="tamilName"
              value={formData.tamilName}
              onChange={(e) => setFormData({ ...formData, tamilName: e.target.value })}
              className="bg-secondary/50"
              placeholder="தமிழில் பெயர்"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth *</Label>
            <Input
              id="dob"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              className="bg-secondary/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select
              value={formData.gender}
              onValueChange={(value: 'male' | 'female') => setFormData({ ...formData, gender: value })}
            >
              <SelectTrigger className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-secondary/50"
              required
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground border-b border-border/50 pb-2">
          Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="place">Place / Street</Label>
            <Input
              id="place"
              value={formData.place}
              onChange={(e) => setFormData({ ...formData, place: e.target.value })}
              className="bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Input
              id="district"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="bg-secondary/50"
            />
          </div>
        </div>
      </div>

      {/* Tamil Address (Optional) */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground border-b border-border/50 pb-2">
          முகவரி (Tamil Address) <span className="text-xs text-muted-foreground font-normal">— Optional</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tamilPlace">இடம் (Place)</Label>
            <Input
              id="tamilPlace"
              value={formData.tamilPlace}
              onChange={(e) => setFormData({ ...formData, tamilPlace: e.target.value })}
              className="bg-secondary/50"
              placeholder="தெரு / இடம்"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tamilCity">நகரம் (City)</Label>
            <Input
              id="tamilCity"
              value={formData.tamilCity}
              onChange={(e) => setFormData({ ...formData, tamilCity: e.target.value })}
              className="bg-secondary/50"
              placeholder="நகரம்"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tamilDistrict">மாவட்டம் (District)</Label>
            <Input
              id="tamilDistrict"
              value={formData.tamilDistrict}
              onChange={(e) => setFormData({ ...formData, tamilDistrict: e.target.value })}
              className="bg-secondary/50"
              placeholder="மாவட்டம்"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tamilState">மாநிலம் (State)</Label>
            <Input
              id="tamilState"
              value={formData.tamilState}
              onChange={(e) => setFormData({ ...formData, tamilState: e.target.value })}
              className="bg-secondary/50"
              placeholder="மாநிலம்"
            />
          </div>
        </div>
      </div>

      {/* Church Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground border-b border-border/50 pb-2">
          Church Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Marital Status</Label>
            <Select
              value={formData.maritalStatus}
              onValueChange={(value: 'single' | 'married' | 'widowed' | 'divorced') => setFormData({ ...formData, maritalStatus: value })}
            >
              <SelectTrigger className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.maritalStatus === 'married' && (
            <div className="space-y-2">
              <Label htmlFor="anniversaryDate">Anniversary Date</Label>
              <Input
                id="anniversaryDate"
                type="date"
                value={formData.anniversaryDate}
                onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="baptismStatus">Baptism Status</Label>
            <Select
              value={formData.baptismStatus}
              onValueChange={(value: 'baptized' | 'not_baptized') => setFormData({ ...formData, baptismStatus: value })}
            >
              <SelectTrigger className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baptized">Baptized</SelectItem>
                <SelectItem value="not_baptized">Not Baptized</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.baptismStatus === 'baptized' && (
            <div className="space-y-2">
              <Label htmlFor="baptismDate">Baptism Date</Label>
              <Input
                id="baptismDate"
                type="date"
                value={formData.baptismDate}
                onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="churchRole">Role in Church</Label>
            <Select
              value={formData.churchRole}
              onValueChange={(value: 'attendee' | 'volunteer' | 'host' | 'operator') => setFormData({ ...formData, churchRole: value })}
            >
              <SelectTrigger className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attendee">Attendee</SelectItem>
                <SelectItem value="volunteer">Volunteer</SelectItem>
                <SelectItem value="host">Host</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="team">Team</Label>
            <Select
              value={formData.team}
              onValueChange={(value) => setFormData({ ...formData, team: value })}
            >
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Member Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: MemberStatus) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="long_absent">Long Absent</SelectItem>
                <SelectItem value="occasional_visitor">Occasional Visitor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea
          id="remarks"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          className="bg-secondary/50"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary/90"
          disabled={!isEditMode && memberCategory === 'existing_family_member' && !selectedFamilyHead}
        >
          {member ? 'Update Member' : 'Add Member'}
        </Button>
      </div>
    </form>
  );
};
