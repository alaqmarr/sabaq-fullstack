'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { startSession, endSession } from '@/actions/sessions';
import { toast } from 'sonner';
import { Play, Square, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SessionControlsProps {
  sessionId: string;
  isActive: boolean;
  isEnded: boolean;
  hasStarted: boolean;
}

export function SessionControls({ sessionId, isActive, isEnded, hasStarted }: SessionControlsProps) {
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const result = await startSession(sessionId);
      if (result.success) {
        toast.success('Session started successfully');
      } else {
        toast.error(result.error || 'Failed to start session');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    setLoading(true);
    try {
      const result = await endSession(sessionId);
      if (result.success) {
        toast.success('Session ended successfully');
      } else {
        toast.error(result.error || 'Failed to end session');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (isEnded) {
    return (
      <Button variant="secondary" disabled className="w-full sm:w-auto">
        Session Ended
      </Button>
    );
  }

  if (isActive) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
            End Session
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop attendance marking. You cannot restart a session once ended.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnd} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (!hasStarted) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Start Session
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will enable attendance marking and notify enrolled users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStart} className="bg-green-600 hover:bg-green-700">
              Start Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return null;
}
