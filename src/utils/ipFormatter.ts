// Utility to clean and format IP addresses

export function cleanIpAddress(ipAddress: string | null): string {
  if (!ipAddress || ipAddress === 'unknown') return 'Unknown';
  
  // Handle comma-separated IPs (X-Forwarded-For)
  // Format: "client_ip, proxy1_ip, proxy2_ip"
  // We want the first one (real client IP)
  const ips = ipAddress.split(',').map(ip => ip.trim());
  const clientIp = ips[0];
  
  // If it's an IPv6 address, format it better
  if (clientIp.includes(':')) {
    // Check if it's a shortened IPv6
    if (clientIp.includes('::')) {
      return clientIp; // Already shortened
    }
    // If it's full IPv6, keep it as is but ensure it's valid
    return clientIp;
  }
  
  return clientIp;
}

export function formatIpForDisplay(ipAddress: string | null): string {
  const cleaned = cleanIpAddress(ipAddress);
  
  // If it's IPv6, show a truncated version for display
  if (cleaned.includes(':') && cleaned !== 'Unknown') {
    const parts = cleaned.split(':');
    if (parts.length > 4) {
      // Show first 2 and last 2 groups
      return `${parts[0]}:${parts[1]}:...:${parts[parts.length - 2]}:${parts[parts.length - 1]}`;
    }
  }
  
  return cleaned;
}
