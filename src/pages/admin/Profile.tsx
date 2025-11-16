import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Upload, Mail, Building2, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [center, setCenter] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setCenter(profile.center);
    }
  }, [profile]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast.success('Profile picture updated successfully');
      loadProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setUpdating(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          center: center,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      loadProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Profile</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage your admin account information
        </p>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Profile Picture</CardTitle>
            <CardDescription className="text-sm">Update your profile photo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-primary/20">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-2xl md:text-3xl bg-primary/10 text-primary">
                    <Shield className="h-12 w-12 md:h-16 md:w-16" />
                  </AvatarFallback>
                </Avatar>
                <Badge 
                  variant="default" 
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              </div>
              <div className="text-center w-full">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </span>
                  </div>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </Label>
                <p className="text-xs text-muted-foreground mt-2">Max 5MB, JPG or PNG</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Account Information</CardTitle>
            <CardDescription className="text-sm">Update your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    <User className="h-4 w-4 inline mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="center" className="text-sm font-medium">
                    <Building2 className="h-4 w-4 inline mr-2" />
                    Center
                  </Label>
                  <Input
                    id="center"
                    value={center}
                    onChange={(e) => setCenter(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={profile?.email}
                  disabled
                  className="bg-muted w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
              <div className="pt-2">
                <Button type="submit" disabled={updating} className="w-full md:w-auto">
                  {updating ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:gap-4 text-sm">
            <div className="flex flex-col md:flex-row md:justify-between py-2 border-b">
              <span className="text-muted-foreground mb-1 md:mb-0">Role</span>
              <Badge variant="default" className="w-fit bg-primary text-primary-foreground">
                <Shield className="h-3 w-3 mr-1" />
                Administrator
              </Badge>
            </div>
            <div className="flex flex-col md:flex-row md:justify-between py-2 border-b">
              <span className="text-muted-foreground mb-1 md:mb-0">Member Since</span>
              <span className="font-medium">
                {profile?.created_at ? format(new Date(profile.created_at), 'PPP') : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:justify-between py-2">
              <span className="text-muted-foreground mb-1 md:mb-0">Last Updated</span>
              <span className="font-medium">
                {profile?.updated_at ? format(new Date(profile.updated_at), 'PPP') : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
