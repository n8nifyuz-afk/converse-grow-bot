import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Sparkles, Shield, Users } from 'lucide-react';
export default function Cookies() {
  const navigate = useNavigate();
  const NavBar = () => <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      
    </nav>;
  return <div className="min-h-screen bg-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="py-16 px-4 border-b">
        <div className="container max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-muted-foreground/20 text-muted-foreground">
            Legal Document
          </Badge>
          <h1 className="text-5xl font-bold mb-6 text-foreground">
            Cookie Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="space-y-6">
            <Card className="border-2 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">What Are Cookies?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="leading-relaxed text-muted-foreground">
                  Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and enabling certain functionality.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">How We Use Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Essential Cookies</h3>
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  </div>
                  <p className="mb-4 text-muted-foreground">These cookies are necessary for the website to function properly and cannot be disabled.</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="border border-border p-3 text-left font-semibold text-foreground">Cookie Name</th>
                          <th className="border border-border p-3 text-left font-semibold text-foreground">Purpose</th>
                          <th className="border border-border p-3 text-left font-semibold text-foreground">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-muted/20 transition-colors">
                          <td className="border border-border p-3 font-mono text-sm bg-muted/10">supabase-auth-token</td>
                          <td className="border border-border p-3 text-muted-foreground">Maintains your login session</td>
                          <td className="border border-border p-3 text-muted-foreground">Session</td>
                        </tr>
                        <tr className="hover:bg-muted/20 transition-colors">
                          <td className="border border-border p-3 font-mono text-sm bg-muted/10">sb-refresh-token</td>
                          <td className="border border-border p-3 text-muted-foreground">Refreshes your authentication</td>
                          <td className="border border-border p-3 text-muted-foreground">30 days</td>
                        </tr>
                        <tr className="hover:bg-muted/20 transition-colors">
                          <td className="border border-border p-3 font-mono text-sm bg-muted/10">cookie-consent</td>
                          <td className="border border-border p-3 text-muted-foreground">Remembers your cookie preferences</td>
                          <td className="border border-border p-3 text-muted-foreground">1 year</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs">⚙</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Functional Cookies</h3>
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  </div>
                  <p className="mb-4 text-muted-foreground">These cookies enable enhanced functionality and personalization.</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="border border-border p-3 text-left font-semibold text-foreground">Cookie Name</th>
                          <th className="border border-border p-3 text-left font-semibold text-foreground">Purpose</th>
                          <th className="border border-border p-3 text-left font-semibold text-foreground">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-muted/20 transition-colors">
                          <td className="border border-border p-3 font-mono text-sm bg-muted/10">theme-preference</td>
                          <td className="border border-border p-3 text-muted-foreground">Remembers your theme setting (light/dark)</td>
                          <td className="border border-border p-3 text-muted-foreground">1 year</td>
                        </tr>
                        <tr className="hover:bg-muted/20 transition-colors">
                          <td className="border border-border p-3 font-mono text-sm bg-muted/10">sidebar-state</td>
                          <td className="border border-border p-3 text-muted-foreground">Remembers sidebar open/closed state</td>
                          <td className="border border-border p-3 text-muted-foreground">30 days</td>
                        </tr>
                        <tr className="hover:bg-muted/20 transition-colors">
                          <td className="border border-border p-3 font-mono text-sm bg-muted/10">user-preferences</td>
                          <td className="border border-border p-3 text-muted-foreground">Stores your interface preferences</td>
                          <td className="border border-border p-3 text-muted-foreground">90 days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Third-Party Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-muted/20 border border-muted hover:border-muted-foreground/30 transition-colors">
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Google OAuth</h3>
                    <p className="mb-3 text-muted-foreground text-sm">When you sign in with Google, Google may set cookies for authentication purposes. These are governed by Google's privacy policy.</p>
                    <p className="text-xs text-muted-foreground">
                      Learn more: <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">Google Privacy Policy</a>
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/20 border border-muted hover:border-muted-foreground/30 transition-colors">
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Supabase</h3>
                    <p className="mb-3 text-muted-foreground text-sm">Our infrastructure provider may set cookies for security and performance monitoring.</p>
                    <p className="text-xs text-muted-foreground">
                      Learn more: <a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">Supabase Privacy Policy</a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Managing Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl bg-muted/20 border border-muted">
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Cookie Consent</h3>
                    <p className="text-sm text-muted-foreground">
                      When you first visit our website, you'll see a cookie banner where you can choose to accept all cookies, reject non-essential cookies, or manage your preferences in detail.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/20 border border-muted">
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Browser Settings</h3>
                    <p className="text-sm mb-3 text-muted-foreground">You can also control cookies through your browser settings:</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li><strong>Chrome:</strong> Settings → Privacy and security</li>
                      <li><strong>Firefox:</strong> Preferences → Privacy & Security</li>
                      <li><strong>Safari:</strong> Preferences → Privacy</li>
                      <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/20 border border-muted">
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Impact of Disabling</h3>
                    <p className="text-sm mb-3 text-muted-foreground">Disabling certain cookies may affect functionality:</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li><strong>Essential cookies:</strong> Service won't work properly</li>
                      <li><strong>Functional cookies:</strong> You may lose personalization</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Updates to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on this page.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">If you have any questions about our use of cookies, please contact us:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                      <span className="text-white text-sm">✉</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Email</p>
                      <a href="mailto:privacy@adamai.chat" className="text-primary hover:underline">privacy@adamai.chat</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                      <span className="text-white text-sm">🔒</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Privacy Policy</p>
                      <a href="/privacy" className="text-primary hover:underline">View our Privacy Policy</a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>;
}