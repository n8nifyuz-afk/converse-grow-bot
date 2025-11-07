import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ActiveSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  modelName: string;
}

export function ActiveSubscriptionDialog({ isOpen, onClose, modelName }: ActiveSubscriptionDialogProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleUpgrade = () => {
    onClose();
    navigate('/cancel-subscription');
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-500" />
            </div>
            <AlertDialogTitle className="text-foreground text-xl">
              Active Subscription Detected
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground space-y-3 pt-2">
            <p>
              You currently have an active <strong className="text-foreground">Pro</strong> subscription.
            </p>
            <p>
              <strong className="text-foreground">{modelName}</strong> requires the <strong className="text-foreground">Ultra Pro</strong> plan.
            </p>
            <p>
              To upgrade to Ultra Pro:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Cancel your current Pro subscription</li>
              <li>Wait for the current billing period to end</li>
              <li>Subscribe to the Ultra Pro plan</li>
            </ol>
            <p className="text-sm">
              Your current subscription benefits will remain active until the end of your billing period.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          <Button
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            Manage Subscription
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
