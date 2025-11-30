import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatTime } from "@/lib/date-utils";

interface FeedbackPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function generateMetadata({ params }: FeedbackPageProps): Promise<Metadata> {
  const { sessionId } = await params;
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { sabaq: true },
  });

  if (!session) {
    return {
      title: "Session Not Found",
    };
  }

  return {
    title: `Feedback: ${session.sabaq.name} | Sabaq Module`,
    description: `Provide feedback for the session on ${formatDate(session.scheduledAt)}`,
  };
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { sessionId } = await params;
  const session = await auth();
  const user = session?.user;

  const sessionData = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      sabaq: {
        select: {
          name: true,
          kitaab: true,
          level: true,
        },
      },
    },
  });

  if (!sessionData) {
    notFound();
  }

  // If user is logged in, check if they have already submitted feedback
  let existingFeedback = null;
  let hasAttended = false;

  if (user?.id) {
    existingFeedback = await prisma.feedback.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: user.id,
        },
      },
    });

    // Check if user attended this session
    const attendance = await prisma.attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: user.id,
        },
      },
    });

    hasAttended = !!attendance;
  }

  return (
    <div className="container max-w-lg mx-auto py-10 px-4">
      <Card className="border-none shadow-lg bg-background/60 backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">{sessionData.sabaq.name}</CardTitle>
          <CardDescription className="text-base">
            {formatDate(sessionData.scheduledAt)} at {formatTime(sessionData.scheduledAt)}
          </CardDescription>
          <div className="text-sm text-muted-foreground">
            {sessionData.sabaq.kitaab} • {sessionData.sabaq.level}
          </div>
        </CardHeader>
        <CardContent>
          {existingFeedback ? (
            <div className="text-center p-6 space-y-2 bg-muted/30 rounded-lg border">
              <h3 className="font-semibold text-lg">Feedback Submitted</h3>
              <p className="text-muted-foreground">
                You have already provided feedback for this session. Thank you!
              </p>
            </div>
          ) : user?.id && !hasAttended ? (
            <div className="text-center p-6 space-y-2 bg-muted/30 rounded-lg border">
              <h3 className="font-semibold text-lg">Attendance Required</h3>
              <p className="text-muted-foreground">
                You must have attended this session to provide feedback.
              </p>
            </div>
          ) : (
            <FeedbackForm sessionId={sessionId} user={user} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
