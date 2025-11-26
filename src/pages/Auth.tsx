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
import { Sparkles, ArrowRight } from 'lucide-react';

const centers = ['Kochi', 'Kozhikode', 'Trivandrum', 'Kannur', 'Thrissur'];

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
          <div className="absolute inset-0 animate-glow-pulse rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      {/* Gradient Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      
      {/* Floating Decoration */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <Card className="w-full max-w-md glass-card relative z-10 border-border/50 animate-fade-in-up">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center shadow-premium transform hover:scale-105 transition-transform duration-300">
                <span className="text-3xl font-bold text-white">B</span>
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-orange-600 to-accent bg-clip-text text-transparent">
              Brototype Connect
            </CardTitle>
            <CardDescription className="text-base font-medium">
              Raise. Track. Resolve. – Powered by Brototype.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="h-11 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="h-11 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-colors"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 btn-premium text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 group" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Logging in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Login
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-colors"
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
                    className="h-11 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-center" className="text-sm font-medium">Center</Label>
                  <Select value={center} onValueChange={setCenter} required>
                    <SelectTrigger id="signup-center" className="h-11 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-colors">
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
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="h-11 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-colors"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 btn-premium text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 group" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign Up
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
