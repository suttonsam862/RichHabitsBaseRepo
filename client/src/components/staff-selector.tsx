import * as React from "react";
import { PlusCircle, X, Check, Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export interface StaffMember {
  id: number;
  name: string;
  role?: string;
  email?: string;
}

// Common props for both single and multiple selection modes
interface BaseStaffSelectorProps {
  allowCreate?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
  campId?: number;
}

// Props for single staff selection
interface SingleStaffSelectorProps extends BaseStaffSelectorProps {
  mode?: 'single';
  selectedStaffId: number | null;
  onStaffSelect: (staffId: number | null) => void;
}

// Props for multiple staff selection
interface MultipleStaffSelectorProps extends BaseStaffSelectorProps {
  mode: 'multiple';
  selectedStaff: StaffMember[];
  onStaffChange: (staff: StaffMember[]) => void;
}

// Union type for the combined props
export type StaffSelectorProps = SingleStaffSelectorProps | MultipleStaffSelectorProps;

export function StaffSelector(props: StaffSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newStaffName, setNewStaffName] = React.useState("");
  const [newStaffRole, setNewStaffRole] = React.useState("");
  const [newStaffEmail, setNewStaffEmail] = React.useState("");
  
  const {
    allowCreate = true,
    label = "Staff Member",
    placeholder = "Search staff...",
    className,
    campId
  } = props;
  
  // Determine if we're in single or multiple selection mode
  const isMultipleMode = props.mode === 'multiple';
  
  // Setup variables based on mode
  const selectedStaffId = isMultipleMode ? null : (props as SingleStaffSelectorProps).selectedStaffId;
  const selectedStaffArray = isMultipleMode ? (props as MultipleStaffSelectorProps).selectedStaff : [];
  
  // Fetch staff members - use camp specific endpoint if campId is provided
  const { data: staffData, isLoading } = useQuery({
    queryKey: campId ? ['/api/camps', campId, 'staff'] : ['/api/staff'],
    queryFn: ({ signal }) => 
      fetch(campId ? `/api/camps/${campId}/staff` : '/api/staff', { signal })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch staff members');
          return res.json();
        })
  });
  
  const staffMembers = staffData?.data || [];
  
  // Find the selected staff member for single mode
  const selectedStaff = !isMultipleMode && selectedStaffId ? 
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
  
  // Filter out already selected staff in multiple mode
  const availableStaff = isMultipleMode 
    ? filteredStaff.filter(staff => !selectedStaffArray.some(selected => selected.id === staff.id))
    : filteredStaff;
  
  const handleSelectStaff = (staff: StaffMember | null) => {
    if (isMultipleMode) {
      if (staff) {
        const updatedStaff = [...selectedStaffArray, staff];
        (props as MultipleStaffSelectorProps).onStaffChange(updatedStaff);
      }
    } else {
      (props as SingleStaffSelectorProps).onStaffSelect(staff?.id || null);
    }
    
    if (!isMultipleMode) {
      setOpen(false);
    }
    setSearchValue("");
  };
  
  const handleRemoveStaff = (staffId: number) => {
    if (isMultipleMode) {
      const updatedStaff = selectedStaffArray.filter(staff => staff.id !== staffId);
      (props as MultipleStaffSelectorProps).onStaffChange(updatedStaff);
    } else {
      (props as SingleStaffSelectorProps).onStaffSelect(null);
    }
  };
  
  const handleCreateStaff = async () => {
    if (!newStaffName.trim()) return;
    
    try {
      const endpoint = campId ? `/api/camps/${campId}/staff` : '/api/staff';
      const response = await fetch(endpoint, {
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
      if (isMultipleMode) {
        const staffMember = newStaff.data;
        const updatedStaff = [...selectedStaffArray, staffMember];
        (props as MultipleStaffSelectorProps).onStaffChange(updatedStaff);
      } else {
        (props as SingleStaffSelectorProps).onStaffSelect(newStaff.data.id);
      }
      
      // Reset form
      setNewStaffName("");
      setNewStaffRole("");
      setNewStaffEmail("");
      setShowCreateForm(false);
      
      if (!isMultipleMode) {
        setOpen(false);
      }
      
      // Invalidate the appropriate query
      queryClient.invalidateQueries({ 
        queryKey: campId ? ['/api/camps', campId, 'staff'] : ['/api/staff']
      });
    } catch (error) {
      console.error('Error creating staff member:', error);
      // Show error toast or message
    }
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && <div className="text-sm font-medium mb-1">{label}</div>}
      
      {/* Single Selection Mode */}
      {!isMultipleMode && selectedStaff ? (
        <div className="flex items-center gap-2">
          <Badge className="px-3 py-1.5 text-sm rounded-md flex items-center gap-2">
            {selectedStaff.name}
            {selectedStaff.role && <span className="text-xs opacity-70">({selectedStaff.role})</span>}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 ml-1"
              onClick={() => handleRemoveStaff(selectedStaff.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
      ) : !isMultipleMode ? (
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
      ) : null}
      
      {/* Multiple Selection Mode */}
      {isMultipleMode && (
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedStaffArray.map(staff => (
              <Badge 
                key={staff.id} 
                className="px-3 py-1.5 text-sm rounded-md flex items-center gap-2"
              >
                {staff.name}
                {staff.role && <span className="text-xs opacity-70">({staff.role})</span>}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 ml-1"
                  onClick={() => handleRemoveStaff(staff.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            {selectedStaffArray.length > 0 ? "Add more staff" : placeholder}
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
                  {!isMultipleMode && (
                    <CommandItem
                      className="flex items-center justify-between px-2"
                      onSelect={() => handleSelectStaff(null)}
                    >
                      <span>No clinician</span>
                      {selectedStaffId === null && (
                        <Check className="h-4 w-4" />
                      )}
                    </CommandItem>
                  )}
                  
                  {(isMultipleMode ? availableStaff : filteredStaff).map((staff: StaffMember) => (
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
                      {!isMultipleMode && selectedStaffId === staff.id && (
                        <Check className="h-4 w-4" />
                      )}
                      {isMultipleMode && selectedStaffArray.some(s => s.id === staff.id) && (
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