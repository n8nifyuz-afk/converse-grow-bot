import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeBlockedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
}

export function UpgradeBlockedDialog({ isOpen, onClose, currentPlan }: UpgradeBlockedDialogProps) {
  const navigate = useNavigate();

  const handleManageSubscription = () => {
    onClose();
    navigate('/cancel-subscription');
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-foreground text-xl">
              Active Subscription Detected
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground space-y-3 pt-2">
            <p>
              You currently have an active <strong className="text-foreground">{currentPlan}</strong> subscription.
            </p>
            <p>
              To upgrade to a different plan, you must first:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Cancel your current subscription</li>
              <li>Receive a prorated refund for unused time</li>
              <li>Purchase your new subscription plan</li>
            </ol>
            <p className="text-sm">
              Your access will continue until the end of your current billing period after cancellation.
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
            onClick={handleManageSubscription}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            Manage Subscription
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
