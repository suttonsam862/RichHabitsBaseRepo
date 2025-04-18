import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DialogScrollPlugin } from '@/components/ui/dialog-scroll-plugin';

export function ClinicianFormWithScroll() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    bio: '',
    experience: '',
    availability: '',
    rate: '',
    notes: ''
  });

  const handleSubmit = () => {
    // Mock submission logic
    console.log('Submitting form data:', formData);
    setOpen(false);
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Add New Clinician</Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Clinician</DialogTitle>
            <DialogDescription>
              Enter the details for the new clinician who will be teaching at the camp.
            </DialogDescription>
          </DialogHeader>
          
          {/* This is where we wrap the form content with our scroll plugin */}
          <DialogScrollPlugin maxHeight="60vh">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="name">Full Name*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter clinician's full name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(123) 456-7890"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="specialty">Specialty/Focus Area*</Label>
                <Select
                  value={formData.specialty}
                  onValueChange={(value) => setFormData({...formData, specialty: value})}
                >
                  <SelectTrigger id="specialty">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technique">Technique</SelectItem>
                    <SelectItem value="conditioning">Conditioning</SelectItem>
                    <SelectItem value="strategy">Strategy</SelectItem>
                    <SelectItem value="mental">Mental Training</SelectItem>
                    <SelectItem value="nutrition">Nutrition</SelectItem>
                    <SelectItem value="injury">Injury Prevention</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Professional background and achievements"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="experience">Experience Level</Label>
                <Select
                  value={formData.experience}
                  onValueChange={(value) => setFormData({...formData, experience: value})}
                >
                  <SelectTrigger id="experience">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (1-3 years)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (4-7 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (8-15 years)</SelectItem>
                    <SelectItem value="expert">Expert (15+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="availability">Availability</Label>
                <Textarea
                  id="availability"
                  value={formData.availability}
                  onChange={(e) => setFormData({...formData, availability: e.target.value})}
                  placeholder="Days and times available"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="rate">Hourly Rate</Label>
                <Input
                  id="rate"
                  value={formData.rate}
                  onChange={(e) => setFormData({...formData, rate: e.target.value})}
                  placeholder="$0.00"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any additional information"
                  rows={3}
                />
              </div>
            </div>
          </DialogScrollPlugin>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              Add Clinician
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}