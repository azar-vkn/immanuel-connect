import React, { useState } from 'react';
import { Member } from '@/types';
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
import { teams } from '@/data/mockData';

interface MemberFormProps {
  member?: Member;
  onSave: (member: Member) => void;
  onCancel: () => void;
}

export const MemberForm: React.FC<MemberFormProps> = ({ member, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: member?.name || '',
    dob: member?.dob || '',
    gender: member?.gender || 'male',
    phone: member?.phone || '',
    place: member?.address?.place || '',
    city: member?.address?.city || '',
    district: member?.address?.district || '',
    state: member?.address?.state || '',
    country: member?.address?.country || 'India',
    pincode: member?.address?.pincode || '',
    memberType: member?.memberType || 'individual',
    maritalStatus: member?.maritalStatus || 'single',
    anniversaryDate: member?.anniversaryDate || '',
    baptismStatus: member?.baptismStatus || 'not_baptized',
    baptismDate: member?.baptismDate || '',
    churchRole: member?.churchRole || 'attendee',
    team: member?.team || '',
    remarks: member?.remarks || '',
  });

  const generateMemberId = (): string => {
    const randomNum = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `IAG${randomNum}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newMember: Member = {
      id: member?.id || crypto.randomUUID(),
      memberId: member?.memberId || generateMemberId(),
      name: formData.name,
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
      memberType: formData.memberType as 'individual' | 'family',
      maritalStatus: formData.maritalStatus as Member['maritalStatus'],
      anniversaryDate: formData.anniversaryDate || undefined,
      baptismStatus: formData.baptismStatus as 'baptized' | 'not_baptized',
      baptismDate: formData.baptismDate || undefined,
      churchRole: formData.churchRole as Member['churchRole'],
      team: formData.team || undefined,
      remarks: formData.remarks || undefined,
      createdAt: member?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newMember);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          {member ? 'Update Member' : 'Add Member'}
        </Button>
      </div>
    </form>
  );
};
