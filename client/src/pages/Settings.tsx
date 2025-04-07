import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/context/AppContext";

export default function Settings() {
  const { toast } = useToast();
  const { user, updateUser, logout } = useAuth();
  const { darkMode, toggleDarkMode, language, setLanguage } = useAppContext();
  
  const [profileImage, setProfileImage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [farmName, setFarmName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Set values when user is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setFarmName(user.farmName || "");
      setProfileImage(user.profileImage || "");
    }
  }, [user]);
  
  // Update user mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("PATCH", `/api/auth/update`, userData);
      return response.json();
    },
    onSuccess: (data) => {
      updateUser(data);
      setIsUpdatingProfile(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: any) => {
      const response = await apiRequest("POST", `/api/auth/password`, passwordData);
      return response.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to change password",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Handle profile update
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    
    updateProfileMutation.mutate({
      name,
      email,
      farmName,
      profileImage
    });
  };
  
  // Handle password change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation don't match",
        variant: "destructive",
      });
      return;
    }
    
    setIsChangingPassword(true);
    
    changePasswordMutation.mutate({
      currentPassword,
      newPassword
    });
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold mb-5 dark:text-white">Settings</h2>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal information and farm details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user ? (
                <div className="space-y-4">
                  <Skeleton className="w-full h-10" />
                  <Skeleton className="w-full h-10" />
                  <Skeleton className="w-full h-10" />
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <i className="bi bi-person text-4xl text-gray-400"></i>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.role}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email address"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="farmName">Farm Name</Label>
                    <Input 
                      id="farmName"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="Your farm name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profileImage">Profile Image URL</Label>
                    <Input 
                      id="profileImage"
                      value={profileImage}
                      onChange={(e) => setProfileImage(e.target.value)}
                      placeholder="URL to your profile image (optional)"
                    />
                    <p className="text-xs text-gray-500">
                      Enter a URL to your profile image or leave blank to use the default
                    </p>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      className="bg-primary text-white hover:bg-primary-dark"
                      disabled={updateProfileMutation.isPending || isUpdatingProfile}
                    >
                      {updateProfileMutation.isPending || isUpdatingProfile ? (
                        <div className="flex items-center">
                          <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                          Saving...
                        </div>
                      ) : "Save Changes"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and account security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input 
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input 
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input 
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <Button 
                      type="submit" 
                      className="bg-primary text-white hover:bg-primary-dark"
                      disabled={
                        changePasswordMutation.isPending || 
                        isChangingPassword || 
                        !currentPassword || 
                        !newPassword || 
                        !confirmPassword
                      }
                    >
                      {changePasswordMutation.isPending || isChangingPassword ? (
                        <div className="flex items-center">
                          <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                          Changing...
                        </div>
                      ) : "Change Password"}
                    </Button>
                  </div>
                </form>
                
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-medium mb-4">Account</h3>
                  
                  <Button 
                    variant="destructive" 
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right mr-2"></i>
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize your app experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Theme</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Switch between light and dark modes
                      </p>
                    </div>
                    <Switch
                      id="dark-mode"
                      checked={darkMode}
                      onCheckedChange={toggleDarkMode}
                    />
                  </div>
                </div>
                
                <div className="border-t pt-6 space-y-3">
                  <h3 className="text-lg font-medium">Language</h3>
                  <div className="space-y-2">
                    <Label htmlFor="language">Application Language</Label>
                    <Select
                      value={language}
                      onValueChange={setLanguage}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sn">Shona</SelectItem>
                        <SelectItem value="zu">Zulu</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Note: Some content may not be available in all languages
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* About Tab */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About FarmFlow</CardTitle>
              <CardDescription>
                Information about the application and help resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center py-6">
                <div className="flex items-center mb-4">
                  <i className="bi bi-tree text-5xl text-primary mr-2"></i>
                  <h1 className="text-3xl font-bold text-primary">FarmFlow</h1>
                </div>
                <p className="text-center text-gray-600 dark:text-gray-400 max-w-md">
                  A comprehensive farm management solution to help farmers efficiently manage tasks, inventory, equipment, and monitor performance.
                </p>
                <p className="mt-2 text-sm text-gray-500">Version 1.0.0</p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Help Resources</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center">
                      <div className="rounded-full bg-blue-100 p-3 mr-4 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                        <i className="bi bi-question-circle text-xl"></i>
                      </div>
                      <div>
                        <h4 className="font-medium">Knowledge Base</h4>
                        <p className="text-sm text-gray-500">Find answers to common questions</p>
                        <a href="#" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                          Visit Knowledge Base
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 flex items-center">
                      <div className="rounded-full bg-green-100 p-3 mr-4 text-green-600 dark:bg-green-900 dark:text-green-300">
                        <i className="bi bi-headset text-xl"></i>
                      </div>
                      <div>
                        <h4 className="font-medium">Support Center</h4>
                        <p className="text-sm text-gray-500">Get assistance from our team</p>
                        <a href="#" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                          Contact Support
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="space-y-2 border-t pt-6">
                <h3 className="text-lg font-medium">Legal</h3>
                <div className="flex flex-col md:flex-row gap-2 text-sm">
                  <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                  <span className="hidden md:inline text-gray-400">•</span>
                  <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                  <span className="hidden md:inline text-gray-400">•</span>
                  <a href="#" className="text-blue-600 hover:underline">Cookies Policy</a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
