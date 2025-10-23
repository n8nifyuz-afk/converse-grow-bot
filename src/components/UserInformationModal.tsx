import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Globe, 
  Monitor, 
  Smartphone, 
  Clock, 
  Languages, 
  Activity,
  Shield,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';

interface UserInformationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userInfo: any;
  activityLogs: any[];
}

const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'CA': 'Canada',
  'AU': 'Australia',
  'DE': 'Germany',
  'FR': 'France',
  'ES': 'Spain',
  'IT': 'Italy',
  'NL': 'Netherlands',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'PL': 'Poland',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'AR': 'Argentina',
  'IN': 'India',
  'CN': 'China',
  'JP': 'Japan',
  'KR': 'South Korea',
  'SG': 'Singapore',
  'MY': 'Malaysia',
  'TH': 'Thailand',
  'PH': 'Philippines',
  'ID': 'Indonesia',
  'VN': 'Vietnam',
  'NZ': 'New Zealand',
  'ZA': 'South Africa',
  'EG': 'Egypt',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'RU': 'Russia',
  'UA': 'Ukraine',
  'TR': 'Turkey',
  'SA': 'Saudi Arabia',
  'AE': 'United Arab Emirates',
  'IL': 'Israel',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'BE': 'Belgium',
  'IE': 'Ireland',
  'PT': 'Portugal',
  'GR': 'Greece',
  'CZ': 'Czech Republic',
  'RO': 'Romania',
  'HU': 'Hungary',
  'BG': 'Bulgaria'
};

const getCountryName = (code: string | null) => {
  if (!code) return 'Unknown';
  return COUNTRY_NAMES[code.toUpperCase()] || code;
};

export const UserInformationModal: React.FC<UserInformationModalProps> = ({
  open,
  onOpenChange,
  userInfo,
  activityLogs
}) => {
  if (!userInfo) return null;

  const browserInfo = userInfo.browser_info || {};
  const deviceInfo = userInfo.device_info || {};
  const oauthMetadata = userInfo.oauth_metadata || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Comprehensive User Information
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="device">Device & Browser</TabsTrigger>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="basic" className="space-y-4 p-1">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Display Name</p>
                      <p className="text-sm">{userInfo.display_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email
                      </p>
                      <p className="text-sm">{userInfo.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                      <p className="text-sm">{userInfo.phone_number || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gender</p>
                      <p className="text-sm">{userInfo.gender || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                      <p className="text-sm">{userInfo.date_of_birth || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        OAuth Provider
                      </p>
                      <Badge variant="outline">{userInfo.oauth_provider || 'email'}</Badge>
                    </div>
                  </div>

                  {userInfo.avatar_url && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Profile Picture</p>
                      <img 
                        src={userInfo.avatar_url} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full border"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location & Network */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location & Network
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                      <p className="text-sm font-mono">{userInfo.ip_address || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Country
                      </p>
                      <p className="text-sm">{getCountryName(userInfo.country)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Timezone
                      </p>
                      <p className="text-sm">{userInfo.timezone || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Languages className="h-3 w-3" />
                        Locale
                      </p>
                      <p className="text-sm">{userInfo.locale || 'Unknown'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Account Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Account Created
                      </p>
                      <p className="text-sm">
                        {userInfo.created_at ? format(new Date(userInfo.created_at), 'PPpp') : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Last Login</p>
                      <p className="text-sm">
                        {userInfo.last_login_at ? format(new Date(userInfo.last_login_at), 'PPpp') : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Logins</p>
                      <p className="text-sm font-bold">{userInfo.login_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Signup Method</p>
                      <Badge>{userInfo.signup_method || 'email'}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="device" className="space-y-4 p-1">
              {/* Browser Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Browser Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Browser</p>
                      <p className="text-sm">{browserInfo.browser || 'Unknown'} {browserInfo.browserVersion}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Operating System</p>
                      <p className="text-sm">{browserInfo.os || 'Unknown'} {browserInfo.osVersion}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Device Type</p>
                      <Badge variant="outline">
                        {browserInfo.isMobile ? <Smartphone className="h-3 w-3 mr-1" /> : <Monitor className="h-3 w-3 mr-1" />}
                        {browserInfo.device || 'Unknown'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Platform</p>
                      <p className="text-sm">{deviceInfo.platform || 'Unknown'}</p>
                    </div>
                  </div>

                  {browserInfo.userAgent && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">User Agent</p>
                      <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                        {browserInfo.userAgent}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Device Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Device Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Screen Resolution</p>
                      <p className="text-sm">{deviceInfo.screenResolution || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Device Pixel Ratio</p>
                      <p className="text-sm">{deviceInfo.devicePixelRatio || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Color Depth</p>
                      <p className="text-sm">{deviceInfo.colorDepth || 'Unknown'} bits</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Touch Support</p>
                      <Badge variant={deviceInfo.touchSupport ? "default" : "secondary"}>
                        {deviceInfo.touchSupport ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CPU Cores</p>
                      <p className="text-sm">{deviceInfo.hardwareConcurrency || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Device Memory</p>
                      <p className="text-sm">{deviceInfo.deviceMemory ? `${deviceInfo.deviceMemory} GB` : 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cookies Enabled</p>
                      <Badge variant={deviceInfo.cookiesEnabled ? "default" : "secondary"}>
                        {deviceInfo.cookiesEnabled ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Do Not Track</p>
                      <p className="text-sm">{deviceInfo.doNotTrack || 'Not set'}</p>
                    </div>
                  </div>

                  {deviceInfo.languages && deviceInfo.languages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Preferred Languages</p>
                      <div className="flex flex-wrap gap-1">
                        {deviceInfo.languages.map((lang: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">{lang}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 p-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Activity
                    <Badge variant="secondary" className="ml-auto">{activityLogs.length} events</Badge>
                  </CardTitle>
                  <CardDescription>
                    Track of user's actions and system events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activityLogs.length > 0 ? (
                    <div className="space-y-2">
                      {activityLogs.map((log, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{log.activity_type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), 'PPpp')}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {log.ip_address && (
                              <div>
                                <span className="font-medium">IP:</span> {log.ip_address}
                              </div>
                            )}
                            {log.country && (
                              <div>
                                <span className="font-medium">Country:</span> {getCountryName(log.country)}
                              </div>
                            )}
                            {log.browser && (
                              <div>
                                <span className="font-medium">Browser:</span> {log.browser}
                              </div>
                            )}
                            {log.device_type && (
                              <div>
                                <span className="font-medium">Device:</span> {log.device_type}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No activity logs available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw" className="space-y-4 p-1">
              <Card>
                <CardHeader>
                  <CardTitle>Raw OAuth Metadata</CardTitle>
                  <CardDescription>Complete OAuth provider response data</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(oauthMetadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Complete Profile Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(userInfo, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
