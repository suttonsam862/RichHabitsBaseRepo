import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ROLES, Permission, type Role } from "@shared/schema";
import { getPermissionDisplayName, getRoleDisplayName, getPermissionGroups, getPermissionsForRole } from "@shared/permissions";
import { Loader2, Shield, ShieldAlert, ShieldCheck, User, Settings, UserPlus, Layers, Key } from "lucide-react";
import { PageVisibilitySettings, getDefaultVisiblePages } from "@/components/ui/page-visibility-settings";
import { SetPasswordDialog } from "@/components/user/set-password-dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

type UserListItem = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
  visiblePages: string[];
  createdAt: string;
};

export default function UserManagement() {
  const { user } = useAuth();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedVisiblePages, setSelectedVisiblePages] = useState<string[]>([]);
  
  // Form state for user creation
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    fullName: "",
    role: ROLES.VIEWER as string,
  });
  
  // Fetch all users
  const { data: usersData, isLoading, error } = useQuery<{ users: UserListItem[] }>({
    queryKey: ['/api/users'],
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest('GET', queryKey[0] as string);
      return response.json();
    },
  });
  
  // Mutation to update user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      await apiRequest('PATCH', `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Role updated",
        description: `User role has been updated to ${getRoleDisplayName(selectedRole as Role)}`,
      });
      setRoleDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to update user permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: number; permissions: string[] }) => {
      await apiRequest('PATCH', `/api/users/${userId}/permissions`, { permissions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Permissions updated",
        description: "User permissions have been updated.",
      });
      setPermissionDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update permissions",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to update user page visibility
  const updateVisiblePagesMutation = useMutation({
    mutationFn: async ({ userId, visiblePages }: { userId: number; visiblePages: string[] }) => {
      await apiRequest('PATCH', `/api/users/${userId}/visible-pages`, { visiblePages });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Page access updated",
        description: "User's page access settings have been updated.",
      });
      setVisibilityDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update page access",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to create new user
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      await apiRequest('POST', '/api/register', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User created",
        description: `New user ${newUser.fullName} has been created.`,
      });
      setCreateUserDialogOpen(false);
      setNewUser({
        email: "",
        password: "",
        fullName: "",
        role: ROLES.VIEWER as string,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // When a user is selected for role editing
  const handleRoleEdit = (user: UserListItem) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setRoleDialogOpen(true);
  };
  
  // When a user is selected for permission editing
  const handlePermissionEdit = (user: UserListItem) => {
    setSelectedUser(user);
    setSelectedPermissions(user.permissions || []);
    setPermissionDialogOpen(true);
  };
  
  // When a user is selected for page visibility editing
  const handleVisibilityEdit = (user: UserListItem) => {
    setSelectedUser(user);
    setSelectedVisiblePages(user.visiblePages || []);
    setVisibilityDialogOpen(true);
  };
  
  // When a user is selected for password reset
  const handlePasswordReset = (user: UserListItem) => {
    setSelectedUser(user);
    setPasswordDialogOpen(true);
  };
  
  // Handle role update submission
  const handleRoleSubmit = () => {
    if (selectedUser && selectedRole) {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        role: selectedRole,
      });
    }
  };
  
  // Handle permissions update submission
  const handlePermissionsSubmit = () => {
    if (selectedUser) {
      updatePermissionsMutation.mutate({
        userId: selectedUser.id,
        permissions: selectedPermissions,
      });
    }
  };
  
  // Handle visible pages update submission
  const handleVisiblePagesSubmit = () => {
    if (selectedUser) {
      updateVisiblePagesMutation.mutate({
        userId: selectedUser.id,
        visiblePages: selectedVisiblePages,
      });
    }
  };
  
  // Handle new user creation
  const handleCreateUser = () => {
    // Validate form
    if (!newUser.email || !newUser.password || !newUser.fullName) {
      toast({
        title: "Validation error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }
    
    createUserMutation.mutate(newUser);
  };
  
  // Handle permission checkbox toggle
  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions(current => {
      if (current.includes(permission)) {
        return current.filter(p => p !== permission);
      } else {
        return [...current, permission];
      }
    });
  };
  
  // For role icon display based on role
  const getRoleIcon = (role: string) => {
    switch (role) {
      case ROLES.ADMIN:
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case ROLES.MANAGER:
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      case ROLES.AGENT:
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !usersData) {
    return (
      <div className="container px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-6">
              <p className="text-red-500">Error loading users. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { users } = usersData;
  
  return (
    <div className="container px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => setCreateUserDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          New User
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            Manage users and their access levels in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>List of all users in the system.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: UserListItem) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell className="flex items-center">
                    {getRoleIcon(user.role)}
                    <span className="ml-2">{getRoleDisplayName(user.role as Role)}</span>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRoleEdit(user)}
                    >
                      Role
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePermissionEdit(user)}
                    >
                      Permissions
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleVisibilityEdit(user)}
                    >
                      <Layers className="h-4 w-4 mr-1" />
                      Page Access
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePasswordReset(user)}
                    >
                      <Key className="h-4 w-4 mr-1" />
                      Password
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Role Edit Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.fullName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="role">Select Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ROLES).map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center">
                      {getRoleIcon(role)}
                      <span className="ml-2">{getRoleDisplayName(role as Role)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Role Permissions:</p>
              <ul className="text-sm list-disc pl-5">
                {Object.values(ROLES).includes(selectedRole as any) &&
                  getPermissionGroups()
                    .filter(group => 
                      group.permissions.some(permission => 
                        selectedRole === ROLES.ADMIN || 
                        (selectedRole && getPermissionsForRole(selectedRole as Role).includes(permission))
                      )
                    )
                    .map(group => (
                      <li key={group.category} className="mb-1">
                        <strong>{group.category}:</strong>{" "}
                        {group.permissions
                          .filter(permission => 
                            selectedRole === ROLES.ADMIN || 
                            (selectedRole && getPermissionsForRole(selectedRole as Role).includes(permission))
                          )
                          .map(getPermissionDisplayName)
                          .join(", ")}
                      </li>
                    ))
                }
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleSubmit} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Permissions Edit Dialog */}
      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Permissions</DialogTitle>
            <DialogDescription>
              Customize permissions for {selectedUser?.fullName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-2">
              User has role: <strong>{selectedUser && getRoleDisplayName(selectedUser.role as Role)}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Select which permissions this user should have:
            </p>
            
            <div className="mt-4 max-h-[50vh] overflow-y-auto pr-2">
              <Accordion type="multiple" defaultValue={getPermissionGroups().map(g => g.category)}>
                {getPermissionGroups().map((group) => (
                  <AccordionItem key={group.category} value={group.category}>
                    <AccordionTrigger>{group.category}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {group.permissions.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox 
                              id={permission}
                              checked={selectedPermissions.includes(permission)}
                              onCheckedChange={() => handlePermissionToggle(permission)}
                            />
                            <Label htmlFor={permission} className="flex-1 cursor-pointer">
                              {getPermissionDisplayName(permission)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePermissionsSubmit} disabled={updatePermissionsMutation.isPending}>
              {updatePermissionsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Page Visibility Dialog */}
      <Dialog open={visibilityDialogOpen} onOpenChange={setVisibilityDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Page Access Settings</DialogTitle>
            <DialogDescription>
              Configure which pages {selectedUser?.fullName} can access.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-2">
              User has role: <strong>{selectedUser && getRoleDisplayName(selectedUser.role as Role)}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Select which pages this user should have access to:
            </p>
            
            <div className="mt-4 max-h-[50vh] overflow-y-auto pr-2">
              <PageVisibilitySettings 
                visiblePages={selectedVisiblePages}
                onChange={setSelectedVisiblePages}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisibilityDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVisiblePagesSubmit} disabled={updateVisiblePagesMutation.isPending}>
              {updateVisiblePagesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Page Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create User Dialog */}
      <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="newUserRole">Role</Label>
              <Select 
                value={newUser.role} 
                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger id="newUserRole">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ROLES).map((role) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center">
                        {getRoleIcon(role)}
                        <span className="ml-2">{getRoleDisplayName(role as Role)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
              {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Set Password Dialog */}
      {selectedUser && (
        <SetPasswordDialog
          isOpen={passwordDialogOpen}
          onClose={() => setPasswordDialogOpen(false)}
          userId={selectedUser.id}
          username={selectedUser.username}
        />
      )}
    </div>
  );
}