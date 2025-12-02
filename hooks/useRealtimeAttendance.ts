"use client";

import { useEffect, useState } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, off } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export interface RealtimeAttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  markedAt: number;
  isLate: boolean;
  minutesLate: number;
  method: string;
  latitude?: string;
  longitude?: string;
  distanceMeters?: number;
}

export interface RealtimeStats {
  totalPresent: number;
  lateCount: number;
}

export function useRealtimeAttendance(
  sessionId: string,
  initialData: any[] = []
) {
  const [attendances, setAttendances] = useState<RealtimeAttendanceRecord[]>(
    []
  );
  const [stats, setStats] = useState<RealtimeStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize with server data if available (mapped to match structure)
    // But usually we want to rely on Firebase for "live" view if active.
    // If initialData is passed, we can use it as a base, but Firebase `onValue` gives full snapshot.
    // So we might not need initialData unless Firebase is empty/loading.

    const app = getFirebaseApp();
    const db = getDatabase(app);
    const attendanceRef = ref(db, `sessions/${sessionId}/attendance`);
    const statsRef = ref(db, `sessions/${sessionId}/stats`);

    const handleAttendanceChange = (snapshot: any) => {
      setIsConnected(true);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data) as RealtimeAttendanceRecord[];
        // Sort by markedAt desc
        list.sort((a, b) => b.markedAt - a.markedAt);
        setAttendances(list);
      } else {
        setAttendances([]);
      }
    };

    const handleStatsChange = (snapshot: any) => {
      if (snapshot.exists()) {
        setStats(snapshot.val());
      }
    };

    const unsubscribeAttendance = onValue(
      attendanceRef,
      handleAttendanceChange
    );
    const unsubscribeStats = onValue(statsRef, handleStatsChange);

    return () => {
      off(attendanceRef, "value", handleAttendanceChange);
      off(statsRef, "value", handleStatsChange);
    };
  }, [sessionId]);

  return { attendances, stats, isConnected };
}
