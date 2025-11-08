import { supabase } from '@/integrations/supabase/client';

export async function resetUsageLimits() {
  try {
    const { data, error } = await supabase.functions.invoke('manual-reset-usage');
    
    if (error) {
      console.error('Failed to reset usage:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Usage reset successfully:', data);
    
    // Trigger refresh event
    window.dispatchEvent(new Event('refresh-usage-limits'));
    
    return { success: true, data };
  } catch (error) {
    console.error('Error resetting usage:', error);
    return { success: false, error: String(error) };
  }
}
