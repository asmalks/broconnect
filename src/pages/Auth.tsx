import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowRight, MessageSquare, CheckCircle2 } from 'lucide-react';
import logoImage from '@/assets/logo-dark.webp';

const centers = ['Kochi', 'Kozhikode', 'Trivandrum', 'Bengaluru', 'Coimbatore', 'Chennai'];

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Full name is required'),
  center: z.string().min(1, 'Please select a center'),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [center, setCenter] = useState('');

  useEffect(() => {
    if (!loading && user && role) {
      navigate(role === 'admin' ? '/admin' : '/student');
    }
  }, [user, role, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
      setIsLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;
      
      toast.success('Welcome back!');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || 'Failed to login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      signupSchema.parse({
        email: signupEmail,
        password: signupPassword,
        fullName,
        center,
      });
      
      setIsLoading(true);

      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            center: center,
          },
        },
      });

      if (error) throw error;
      
      toast.success('Account created successfully! Please login.');
      // Switch to login tab
      document.querySelector<HTMLButtonElement>('[value="login"]')?.click();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || 'Failed to sign up');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Side - Minimal Vector Graphic */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden sidebar-gradient items-center justify-center p-12">
        {/* Simple Geometric Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-300/10 rounded-full blur-3xl"></div>
        </div>

        {/* Minimal Vector Illustration */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-8">
          {/* Abstract Vector Graphic */}
          <div className="relative w-80 h-80">
            {/* Main Circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-72 h-72 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <div className="w-56 h-56 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <img src={logoImage} alt="Brototype" className="w-32 h-auto" />
                </div>
              </div>
            </div>
            
            {/* Floating Icons */}
            <div className="absolute top-8 right-8 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 animate-float">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div className="absolute bottom-12 left-8 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 animate-float" style={{ animationDelay: '1s' }}>
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Minimal Text */}
          <div className="space-y-3 max-w-md">
            <h1 className="text-4xl font-bold text-white">Brototype Connect</h1>
            <p className="text-xl text-white/80">Raise. Track. Resolve.</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <Card className="edu-card border-0 shadow-xl">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="text-2xl md:text-3xl font-bold text-center text-foreground">
                Welcome
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Sign in to your account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1.5 bg-muted/50 rounded-2xl mb-6">
                  <TabsTrigger 
                    value="login" 
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="h-12 rounded-xl"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="h-12 rounded-xl"
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-12 btn-purple mt-6 group" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Signing in...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Sign In
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                
                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-center" className="text-sm font-medium">Center</Label>
                      <Select value={center} onValueChange={setCenter} required>
                        <SelectTrigger id="signup-center" className="h-12 rounded-xl">
                          <SelectValue placeholder="Select your center" />
                        </SelectTrigger>
                        <SelectContent>
                          {centers.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 btn-purple mt-6 group" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating account...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Create Account
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            Powered by Brototype
          </p>
        </div>
      </div>
    </div>
  );
}
