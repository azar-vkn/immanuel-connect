import React, { useState } from 'react';
import { mockEvents } from '@/data/mockData';
import { ChurchEvent } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Calendar, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const Events: React.FC = () => {
  const { hasPermission } = useAuth();
  const [events, setEvents] = useState<ChurchEvent[]>(mockEvents);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: ''
  });

  const canCreate = hasPermission('events.create');
  const canEdit = hasPermission('events.edit');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEvent) {
      setEvents(events.map(ev => 
        ev.id === editingEvent.id 
          ? { ...ev, ...formData }
          : ev
      ));
    } else {
      const newEvent: ChurchEvent = {
        id: crypto.randomUUID(),
        name: formData.name,
        date: formData.date,
        description: formData.description,
        createdAt: new Date().toISOString()
      };
      setEvents([newEvent, ...events]);
    }

    setFormData({ name: '', date: '', description: '' });
    setEditingEvent(null);
    setShowAddModal(false);
  };

  const handleEdit = (event: ChurchEvent) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      date: event.date,
      description: event.description || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(ev => ev.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gold-gradient">Events</h1>
          <p className="text-muted-foreground">Manage church events and services</p>
        </div>
        {canCreate && (
          <Dialog open={showAddModal} onOpenChange={(open) => {
            setShowAddModal(open);
            if (!open) {
              setEditingEvent(null);
              setFormData({ name: '', date: '', description: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="glass">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-secondary/50"
                    placeholder="e.g., Sunday Service"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-secondary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-secondary/50"
                    placeholder="Event details..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    {editingEvent ? 'Update' : 'Create'} Event
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event, index) => (
          <div
            key={event.id}
            className="glass rounded-xl p-6 card-hover animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Calendar className="w-6 h-6" />
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-blue-400"
                    onClick={() => handleEdit(event)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">{event.name}</h3>
            <p className="text-primary font-medium text-sm mb-3">
              {format(new Date(event.date), 'EEEE, MMMM dd, yyyy')}
            </p>
            {event.description && (
              <p className="text-muted-foreground text-sm">{event.description}</p>
            )}
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No events created yet.</p>
        </div>
      )}
    </div>
  );
};

export default Events;
