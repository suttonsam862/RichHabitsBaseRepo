import * as React from "react";
import { PlusCircle, X, Check, Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export interface StaffMember {
  id: number;
  name: string;
  role?: string;
  email?: string;
}

interface StaffSelectorProps {
  selectedStaffId: number | null;
  onStaffSelect: (staffId: number | null) => void;
  allowCreate?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function StaffSelector({
  selectedStaffId,
  onStaffSelect,
  allowCreate = true,
  label = "Staff Member",
  placeholder = "Search staff...",
  className
}: StaffSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newStaffName, setNewStaffName] = React.useState("");
  const [newStaffRole, setNewStaffRole] = React.useState("");
  const [newStaffEmail, setNewStaffEmail] = React.useState("");
  
  // Fetch staff members
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['/api/staff'],
    queryFn: ({ signal }) => 
      fetch('/api/staff', { signal })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch staff members');
          return res.json();
        })
  });
  
  const staffMembers = staffData?.data || [];
  
  // Find the selected staff member
  const selectedStaff = selectedStaffId ? 
    staffMembers.find((staff: StaffMember) => staff.id === selectedStaffId) : 
    null;
  
  // Filter staff members based on search
  const filteredStaff = React.useMemo(() => {
    if (!searchValue.trim()) return staffMembers;
    
    return staffMembers.filter((staff: StaffMember) => 
      staff.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      (staff.role && staff.role.toLowerCase().includes(searchValue.toLowerCase())) ||
      (staff.email && staff.email.toLowerCase().includes(searchValue.toLowerCase()))
    );
  }, [staffMembers, searchValue]);
  
  const handleSelectStaff = (staff: StaffMember | null) => {
    onStaffSelect(staff?.id || null);
    setOpen(false);
    setSearchValue("");
  };
  
  const handleClearSelection = () => {
    onStaffSelect(null);
  };
  
  const handleCreateStaff = async () => {
    if (!newStaffName.trim()) return;
    
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newStaffName.trim(),
          role: newStaffRole.trim() || undefined,
          email: newStaffEmail.trim() || undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create staff member');
      }
      
      const newStaff = await response.json();
      
      // Select the newly created staff member
      onStaffSelect(newStaff.data.id);
      
      // Reset form
      setNewStaffName("");
      setNewStaffRole("");
      setNewStaffEmail("");
      setShowCreateForm(false);
      setOpen(false);
      
      // Invalidate staff query to refetch the list
      // queryClient.invalidateQueries(['/api/staff']); // Uncomment if you have access to queryClient
    } catch (error) {
      console.error('Error creating staff member:', error);
      // Show error toast or message
    }
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && <div className="text-sm font-medium mb-1">{label}</div>}
      
      {selectedStaff ? (
        <div className="flex items-center gap-2">
          <Badge className="px-3 py-1.5 text-sm rounded-md flex items-center gap-2">
            {selectedStaff.name}
            {selectedStaff.role && <span className="text-xs opacity-70">({selectedStaff.role})</span>}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 ml-1"
              onClick={handleClearSelection}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
      ) : (
        <div>
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            {placeholder}
          </Button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80" onClick={() => setOpen(false)}>
          <div 
            className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg" 
            onClick={e => e.stopPropagation()}
          >
            <Command className="rounded-lg border shadow-md">
              <CommandInput 
                placeholder={placeholder} 
                value={searchValue}
                onValueChange={setSearchValue}
              />
              
              <CommandList className="max-h-[300px] overflow-y-auto">
                <CommandEmpty>
                  {allowCreate ? (
                    <div className="py-6 text-center">
                      <p className="text-sm text-muted-foreground mb-2">No staff found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateForm(true)}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create new staff member
                      </Button>
                    </div>
                  ) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">No staff found</p>
                  )}
                </CommandEmpty>
                
                <CommandGroup>
                  <CommandItem
                    className="flex items-center justify-between px-2"
                    onSelect={() => handleSelectStaff(null)}
                  >
                    <span>No clinician</span>
                    {selectedStaffId === null && (
                      <Check className="h-4 w-4" />
                    )}
                  </CommandItem>
                  
                  {filteredStaff.map((staff: StaffMember) => (
                    <CommandItem
                      key={staff.id}
                      className="flex items-center justify-between px-2"
                      onSelect={() => handleSelectStaff(staff)}
                    >
                      <div className="flex flex-col">
                        <span>{staff.name}</span>
                        {staff.role && (
                          <span className="text-xs text-muted-foreground">{staff.role}</span>
                        )}
                      </div>
                      {selectedStaffId === staff.id && (
                        <Check className="h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                  
                  {allowCreate && !showCreateForm && (
                    <CommandItem
                      className="border-t py-3 mt-2"
                      onSelect={() => setShowCreateForm(true)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create new staff member
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
            
            {/* Create form */}
            {showCreateForm && (
              <div className="mt-4 space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">Create new staff member</h3>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name *
                    </label>
                    <input
                      id="name"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label htmlFor="role" className="text-sm font-medium">
                      Role
                    </label>
                    <input
                      id="role"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      placeholder="Position or role"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateStaff}
                    disabled={!newStaffName.trim()}
                  >
                    Create
                  </Button>
                </div>
              </div>
            )}
            
            {!showCreateForm && (
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}