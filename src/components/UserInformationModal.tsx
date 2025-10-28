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
import { toZonedTime } from 'date-fns-tz';
import { formatIpForDisplay } from '@/utils/ipFormatter';

interface UserInformationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userInfo: any;
  activityLogs: any[];
}

const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada', 'AU': 'Australia',
  'DE': 'Germany', 'FR': 'France', 'ES': 'Spain', 'IT': 'Italy', 'NL': 'Netherlands',
  'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'PL': 'Poland',
  'BR': 'Brazil', 'MX': 'Mexico', 'AR': 'Argentina', 'CL': 'Chile', 'CO': 'Colombia',
  'PE': 'Peru', 'VE': 'Venezuela', 'EC': 'Ecuador', 'BO': 'Bolivia', 'PY': 'Paraguay',
  'UY': 'Uruguay', 'IN': 'India', 'CN': 'China', 'JP': 'Japan', 'KR': 'South Korea',
  'SG': 'Singapore', 'MY': 'Malaysia', 'TH': 'Thailand', 'PH': 'Philippines',
  'ID': 'Indonesia', 'VN': 'Vietnam', 'BD': 'Bangladesh', 'PK': 'Pakistan',
  'NZ': 'New Zealand', 'ZA': 'South Africa', 'EG': 'Egypt', 'NG': 'Nigeria',
  'KE': 'Kenya', 'GH': 'Ghana', 'ET': 'Ethiopia', 'TZ': 'Tanzania', 'UG': 'Uganda',
  'RU': 'Russia', 'UA': 'Ukraine', 'TR': 'Turkey', 'SA': 'Saudi Arabia',
  'AE': 'United Arab Emirates', 'IL': 'Israel', 'IQ': 'Iraq', 'IR': 'Iran',
  'CH': 'Switzerland', 'AT': 'Austria', 'BE': 'Belgium', 'IE': 'Ireland',
  'PT': 'Portugal', 'GR': 'Greece', 'CZ': 'Czech Republic', 'RO': 'Romania',
  'HU': 'Hungary', 'BG': 'Bulgaria', 'HR': 'Croatia', 'RS': 'Serbia', 'SK': 'Slovakia',
  'SI': 'Slovenia', 'LT': 'Lithuania', 'LV': 'Latvia', 'EE': 'Estonia',
  'IS': 'Iceland', 'MT': 'Malta', 'CY': 'Cyprus', 'LU': 'Luxembourg',
  'AL': 'Albania', 'MK': 'North Macedonia', 'BA': 'Bosnia and Herzegovina',
  'ME': 'Montenegro', 'KZ': 'Kazakhstan', 'UZ': 'Uzbekistan', 'GE': 'Georgia',
  'AM': 'Armenia', 'AZ': 'Azerbaijan', 'BY': 'Belarus', 'MD': 'Moldova',
  'MA': 'Morocco', 'DZ': 'Algeria', 'TN': 'Tunisia', 'LY': 'Libya', 'SD': 'Sudan',
  'JO': 'Jordan', 'LB': 'Lebanon', 'SY': 'Syria', 'YE': 'Yemen', 'OM': 'Oman',
  'KW': 'Kuwait', 'QA': 'Qatar', 'BH': 'Bahrain', 'AF': 'Afghanistan',
  'NP': 'Nepal', 'LK': 'Sri Lanka', 'MM': 'Myanmar', 'KH': 'Cambodia',
  'LA': 'Laos', 'MN': 'Mongolia', 'TW': 'Taiwan', 'HK': 'Hong Kong', 'MO': 'Macau',
  'BN': 'Brunei', 'TL': 'East Timor', 'PG': 'Papua New Guinea', 'FJ': 'Fiji',
  'NC': 'New Caledonia', 'PF': 'French Polynesia', 'GU': 'Guam', 'PR': 'Puerto Rico',
  'DO': 'Dominican Republic', 'CU': 'Cuba', 'JM': 'Jamaica', 'HT': 'Haiti',
  'BS': 'Bahamas', 'BB': 'Barbados', 'TT': 'Trinidad and Tobago', 'BZ': 'Belize',
  'GT': 'Guatemala', 'HN': 'Honduras', 'SV': 'El Salvador', 'NI': 'Nicaragua',
  'CR': 'Costa Rica', 'PA': 'Panama', 'SN': 'Senegal', 'CI': 'Ivory Coast',
  'CM': 'Cameroon', 'ZW': 'Zimbabwe', 'ZM': 'Zambia', 'MW': 'Malawi', 'MZ': 'Mozambique',
  'AO': 'Angola', 'NA': 'Namibia', 'BW': 'Botswana', 'LS': 'Lesotho', 'SZ': 'Eswatini',
  'MG': 'Madagascar', 'MU': 'Mauritius', 'RE': 'Réunion', 'SC': 'Seychelles'
};

const getCountryName = (code: string | null) => {
  if (!code) return 'Unknown';
  return COUNTRY_NAMES[code.toUpperCase()] || code;
};

const formatInCyprusTime = (date: string | Date, formatStr: string) => {
  const cyprusTimeZone = 'Europe/Nicosia';
  const zonedDate = toZonedTime(new Date(date), cyprusTimeZone);
  return format(zonedDate, formatStr);
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

  // Filter activity logs to show only unique login/register events
  // Remove duplicates within 5 minutes
  const uniqueActivityLogs = activityLogs.filter((log, index, array) => {
    if (index === 0) return true;
    
    const currentTime = new Date(log.created_at).getTime();
    const prevTime = new Date(array[index - 1].created_at).getTime();
    const timeDiff = currentTime - prevTime;
    
    // Only keep if more than 5 minutes apart OR different activity type
    return timeDiff > 5 * 60 * 1000 || log.activity_type !== array[index - 1].activity_type;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">User Information</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
          <div className="border-b overflow-x-auto flex-shrink-0 px-2 sm:px-4">
            <TabsList className="inline-flex w-auto min-w-full h-auto p-0 bg-transparent gap-0">
              <TabsTrigger 
                value="basic" 
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
              >
                Basic
              </TabsTrigger>
              <TabsTrigger 
                value="device"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
              >
                Device
              </TabsTrigger>
              <TabsTrigger 
                value="activity"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
              >
                Activity
              </TabsTrigger>
              <TabsTrigger 
                value="raw"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
              >
                Raw Data
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="basic" className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 mt-0">
              {/* Personal Information */}
              <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 md:pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Display Name</p>
                      <p className="text-sm sm:text-base font-semibold truncate">{userInfo.display_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 mb-1">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        Email
                      </p>
                      <p className="text-sm sm:text-base font-semibold truncate">{userInfo.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Phone Number</p>
                      <p className="text-xs sm:text-sm">
                        {userInfo.phone_number || (
                          <span className="text-muted-foreground italic">Not shared</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Gender</p>
                      <p className="text-xs sm:text-sm">
                        {userInfo.gender || (
                          <span className="text-muted-foreground italic">Not shared</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Date of Birth</p>
                      <p className="text-xs sm:text-sm">
                        {userInfo.date_of_birth ? format(new Date(userInfo.date_of_birth), 'PP') : (
                          <span className="text-muted-foreground italic">Not shared</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 mb-1">
                        <Shield className="h-3 w-3 flex-shrink-0" />
                        OAuth Provider
                      </p>
                      <Badge variant="outline" className="capitalize text-xs">{userInfo.oauth_provider || 'email'}</Badge>
                    </div>
                  </div>

                  {userInfo.avatar_url && (
                    <div className="col-span-1 sm:col-span-2">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Profile Picture</p>
                      <img 
                        src={userInfo.avatar_url} 
                        alt="Profile" 
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-primary/20 shadow-lg"
                      />
                    </div>
                  )}

                  <div className="col-span-1 sm:col-span-2 mt-2 p-2 sm:p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                      <strong>Note:</strong> Phone, gender, and birth date are typically not shared by OAuth providers due to privacy policies.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Location & Network */}
              <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Location & Network
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 md:pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">IP Address</p>
                      <p className="text-xs sm:text-sm font-mono font-semibold truncate">{formatIpForDisplay(userInfo.ip_address)}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 mb-1">
                        <Globe className="h-3 w-3 flex-shrink-0" />
                        Country
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-semibold truncate">{getCountryName(userInfo.country)}</p>
                        {userInfo.country && (
                          <Badge variant="secondary" className="text-[10px] flex-shrink-0">{userInfo.country.toUpperCase()}</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        Timezone
                      </p>
                      <p className="text-xs sm:text-sm font-semibold truncate">{userInfo.timezone || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 mb-1">
                        <Languages className="h-3 w-3 flex-shrink-0" />
                        Locale
                      </p>
                      <p className="text-xs sm:text-sm font-semibold truncate">{userInfo.locale || 'Unknown'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Statistics */}
              <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Account Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 md:pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        Account Created
                      </p>
                      <p className="text-xs sm:text-sm font-semibold">
                        {userInfo.created_at ? formatInCyprusTime(userInfo.created_at, 'PP p') : 'Unknown'}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        {userInfo.created_at && `(${Math.floor((Date.now() - new Date(userInfo.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago)`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Last Login</p>
                      <p className="text-xs sm:text-sm font-semibold">
                        {userInfo.last_login_at ? formatInCyprusTime(userInfo.last_login_at, 'PP p') : 'No login recorded'}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        {userInfo.last_login_at && `(${Math.floor((Date.now() - new Date(userInfo.last_login_at).getTime()) / (1000 * 60 * 60))} hours ago)`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Logins</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary">{userInfo.login_count || 0}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Login sessions</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Signup Method</p>
                      <Badge variant="default" className="capitalize text-xs sm:text-sm">{userInfo.signup_method || 'email'}</Badge>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">Authentication provider</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="device" className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 mt-0">
              {/* Browser Information */}
              <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Monitor className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Browser Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 md:pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Browser</p>
                      <p className="text-xs sm:text-sm truncate">{browserInfo.browser || 'Unknown'} {browserInfo.browserVersion}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Operating System</p>
                      <p className="text-xs sm:text-sm truncate">{browserInfo.os || 'Unknown'} {browserInfo.osVersion}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Device Type</p>
                      <Badge variant="outline" className="text-xs">
                        {browserInfo.isMobile ? <Smartphone className="h-3 w-3 mr-1 flex-shrink-0" /> : <Monitor className="h-3 w-3 mr-1 flex-shrink-0" />}
                        {browserInfo.device || 'Unknown'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Platform</p>
                      <p className="text-xs sm:text-sm truncate">{deviceInfo.platform || 'Unknown'}</p>
                    </div>
                  </div>

                  {browserInfo.userAgent && (
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">User Agent</p>
                      <p className="text-[10px] sm:text-xs font-mono bg-muted p-2 sm:p-2.5 rounded break-all leading-relaxed">
                        {browserInfo.userAgent}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Device Specifications */}
              <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Device Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 md:pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Screen Resolution</p>
                      <p className="text-xs sm:text-sm truncate">{deviceInfo.screenResolution || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Device Pixel Ratio</p>
                      <p className="text-xs sm:text-sm truncate">{deviceInfo.devicePixelRatio || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Color Depth</p>
                      <p className="text-xs sm:text-sm truncate">{deviceInfo.colorDepth || 'Unknown'} bits</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Touch Support</p>
                      <Badge variant={deviceInfo.touchSupport ? "default" : "secondary"} className="text-xs">
                        {deviceInfo.touchSupport ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">CPU Cores</p>
                      <p className="text-xs sm:text-sm truncate">{deviceInfo.hardwareConcurrency || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Device Memory</p>
                      <p className="text-xs sm:text-sm truncate">{deviceInfo.deviceMemory ? `${deviceInfo.deviceMemory} GB` : 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Cookies Enabled</p>
                      <Badge variant={deviceInfo.cookiesEnabled ? "default" : "secondary"} className="text-xs">
                        {deviceInfo.cookiesEnabled ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Do Not Track</p>
                      <p className="text-xs sm:text-sm truncate">{deviceInfo.doNotTrack || 'Not set'}</p>
                    </div>
                  </div>

                  {deviceInfo.languages && deviceInfo.languages.length > 0 && (
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Preferred Languages</p>
                      <div className="flex flex-wrap gap-1.5">
                        {deviceInfo.languages.map((lang: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-[10px] sm:text-xs">{lang}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 mt-0">
              <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      Recent Activity
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs w-fit">{uniqueActivityLogs.length} events</Badge>
                  </div>
                  <CardDescription className="text-xs sm:text-sm mt-2">
                    Track of user's login and registration events
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 md:pt-0">
                  {uniqueActivityLogs.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {uniqueActivityLogs.map((log, idx) => (
                        <div key={idx} className="p-2.5 sm:p-3 border rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <Badge variant="outline" className="text-xs w-fit">{log.activity_type}</Badge>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              {formatInCyprusTime(log.created_at, 'PP p')}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                            {log.ip_address && (
                              <div>
                                <span className="font-medium">IP:</span> {formatIpForDisplay(log.ip_address)}
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
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">
                      No activity logs available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw" className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 mt-0">
              <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-sm sm:text-base">Complete OAuth Metadata</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    All data received from the OAuth provider (Google, Microsoft, Apple)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 md:pt-0">
                  {oauthMetadata && Object.keys(oauthMetadata).length > 0 ? (
                    <>
                      {/* Show structured OAuth fields first */}
                      <div className="space-y-3 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          {oauthMetadata.email && (
                            <div className="p-2 sm:p-2.5 bg-muted/50 rounded border">
                              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Email</p>
                              <p className="text-xs sm:text-sm font-mono break-all">{oauthMetadata.email}</p>
                            </div>
                          )}
                          {oauthMetadata.email_verified !== undefined && (
                            <div className="p-2 sm:p-2.5 bg-muted/50 rounded border">
                              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Email Verified</p>
                              <Badge variant={oauthMetadata.email_verified ? "default" : "secondary"} className="text-xs">
                                {oauthMetadata.email_verified ? "✓ Verified" : "✗ Not Verified"}
                              </Badge>
                            </div>
                          )}
                          {oauthMetadata.phone_verified !== undefined && (
                            <div className="p-2 sm:p-2.5 bg-muted/50 rounded border">
                              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Phone Verified</p>
                              <Badge variant={oauthMetadata.phone_verified ? "default" : "secondary"} className="text-xs">
                                {oauthMetadata.phone_verified ? "✓ Verified" : "✗ Not Verified"}
                              </Badge>
                            </div>
                          )}
                          {oauthMetadata.provider_id && (
                            <div className="p-2 sm:p-2.5 bg-muted/50 rounded border">
                              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Provider ID</p>
                              <p className="text-[10px] sm:text-xs font-mono break-all">{oauthMetadata.provider_id}</p>
                            </div>
                          )}
                          {oauthMetadata.sub && (
                            <div className="p-2 sm:p-2.5 bg-muted/50 rounded border">
                              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Subject (Sub)</p>
                              <p className="text-[10px] sm:text-xs font-mono break-all">{oauthMetadata.sub}</p>
                            </div>
                          )}
                          {oauthMetadata.iss && (
                            <div className="p-2 sm:p-2.5 bg-muted/50 rounded border">
                              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Issuer</p>
                              <p className="text-[10px] sm:text-xs font-mono break-all">{oauthMetadata.iss}</p>
                            </div>
                          )}
                          {oauthMetadata.given_name && (
                            <div className="p-2 sm:p-2.5 bg-muted/50 rounded border">
                              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Given Name</p>
                              <p className="text-xs sm:text-sm">{oauthMetadata.given_name}</p>
                            </div>
                          )}
                          {oauthMetadata.family_name && (
                            <div className="p-2 sm:p-2.5 bg-muted/50 rounded border">
                              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Family Name</p>
                              <p className="text-xs sm:text-sm">{oauthMetadata.family_name}</p>
                            </div>
                          )}
                          {oauthMetadata.accent_color && (
                            <div className="p-2 sm:p-2.5 bg-muted/50 rounded border">
                              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Accent Color</p>
                              <p className="text-xs sm:text-sm capitalize">{oauthMetadata.accent_color}</p>
                            </div>
                          )}
                          {oauthMetadata.theme && (
                            <div className="p-2 sm:p-2.5 bg-muted/50 rounded border">
                              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Theme Preference</p>
                              <p className="text-xs sm:text-sm capitalize">{oauthMetadata.theme}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Raw JSON for technical analysis */}
                      <div>
                        <p className="text-xs sm:text-sm font-medium mb-2">Complete Raw JSON</p>
                        <pre className="text-[10px] sm:text-xs bg-muted p-2.5 sm:p-4 rounded overflow-auto max-h-64 sm:max-h-96 border">
                          {JSON.stringify(oauthMetadata, null, 2)}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-6">
                      No OAuth metadata available (email/password signup)
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-sm sm:text-base">Complete Profile Data</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Full database record</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 md:pt-0">
                  <pre className="text-[10px] sm:text-xs bg-muted p-2.5 sm:p-4 rounded overflow-auto max-h-64 sm:max-h-96 border">
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
