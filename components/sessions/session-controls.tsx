'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { startSession, resumeSession } from '@/actions/sessions';
import { toast } from 'sonner';
import { Play, Square, Loader2, RotateCcw } from 'lucide-react';
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
import { EndSessionDialog } from './end-session-dialog';

interface SessionControlsProps {
  sessionId: string;
  sabaqName: string;
  isActive: boolean;
  isEnded: boolean;
  hasStarted: boolean;
}

export function SessionControls({ sessionId, sabaqName, isActive, isEnded, hasStarted }: SessionControlsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResume = async () => {
    setLoading(true);
    try {
      const result = await resumeSession(sessionId);
      if (result.success) {
        toast.success('Session resumed successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to resume session');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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

  if (isEnded) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
            Resume Session
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will re-enable attendance marking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResume}>
              Resume Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (isActive) {
    return (
      <EndSessionDialog
        sessionId={sessionId}
        sabaqName={sabaqName}
        onSuccess={() => router.refresh()}
      >
        <Button variant="frosted-red" disabled={loading} className="w-full sm:w-auto">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
          End Session
        </Button>
      </EndSessionDialog>
    );
  }

  if (!hasStarted) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="frosted-green" className="w-full sm:w-auto" disabled={loading}>
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
