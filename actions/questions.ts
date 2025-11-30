"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { queueEmail, processEmailQueue } from "./email-queue";
import { requirePermission } from "@/lib/rbac";
import { QuestionSchema, AnswerSchema } from "@/schemas";
import { generateQuestionId } from "@/lib/id-generators";
import { formatDate, formatTime, formatDateTime } from "@/lib/date-utils";

// Validate user attended session
async function validateAttendance(sessionId: string, userId: string) {
  const attendance = await prisma.attendance.findUnique({
    where: {
      sessionId_userId: {
        sessionId,
        userId,
      },
    },
  });

  if (!attendance) {
    throw new Error("You must attend the session to submit questions");
  }

  return true;
}

// Submit a new question (Public/Guest access)
export async function submitQuestionPublic({
  sessionId,
  question,
  itsNumber,
}: {
  sessionId: string;
  question: string;
  itsNumber?: string;
}) {
  try {
    let userId: string;

    // 1. Identify User
    const session = await auth();
    if (session?.user?.id) {
      userId = session.user.id;
    } else if (itsNumber) {
      // Guest mode: Find user by ITS
      const user = await prisma.user.findUnique({
        where: { itsNumber },
      });
      if (!user) {
        return {
          success: false,
          error: "User not found. Please register first.",
        };
      }
      userId = user.id;
    } else {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Get Session & Sabaq Info
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { sabaq: true },
    });

    if (!sessionData) {
      return { success: false, error: "Session not found" };
    }

    // 3. Check Enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        sabaqId_userId: {
          sabaqId: sessionData.sabaqId,
          userId: userId,
        },
      },
    });

    if (!enrollment || enrollment.status !== "APPROVED") {
      return { success: false, error: "You are not enrolled in this sabaq." };
    }

    // 4. Check Attendance
    const attendance = await prisma.attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
    });

    if (!attendance) {
      return {
        success: false,
        error: "You must mark attendance before asking a question.",
      };
    }

    // Create Question with human-readable ID
    const questionId = await generateQuestionId(sessionId);

    // 5. Create Question
    const newQuestion = await prisma.question.create({
      data: {
        id: questionId,
        sessionId,
        sabaqId: sessionData.sabaqId,
        userId,
        question,
        upvotes: 1,
      },
    });

    // Create initial vote
    await prisma.questionVote.create({
      data: {
        questionId: newQuestion.id,
        userId,
      },
    });

    // Increment counters
    await prisma.session.update({
      where: { id: sessionId },
      data: { questionsCount: { increment: 1 } },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { questionsCount: { increment: 1 } },
    });

    revalidatePath(`/dashboard/sessions/${sessionId}`);
    return { success: true, question: newQuestion };
  } catch (error: any) {
    console.error("Failed to submit public question:", error);
    return {
      success: false,
      error: error.message || "Failed to submit question",
    };
  }
}

// Submit a new question (Internal/Dashboard access)
export async function submitQuestion(sessionId: string, questionText: string) {
  try {
    const currentUser = await requirePermission("questions", "create");

    // Validate input
    const validatedData = QuestionSchema.parse({
      sessionId,
      question: questionText,
    });

    // Check attendance
    await validateAttendance(sessionId, currentUser.id);

    // Get session and sabaq info
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { sabaq: true },
    });

    if (!sessionData) {
      return { success: false, error: "Session not found" };
    }

    // Create question with human-readable ID
    const questionId = await generateQuestionId(sessionId);

    // Create question with initial upvote from submitter
    const question = await prisma.question.create({
      data: {
        id: questionId,
        sessionId,
        sabaqId: sessionData.sabaqId,
        userId: currentUser.id,
        question: validatedData.question,
        upvotes: 1, // Start with 1 from submitter
      },
    });

    // Create initial vote from submitter
    await prisma.questionVote.create({
      data: {
        questionId: question.id,
        userId: currentUser.id,
      },
    });

    // Increment counters
    await prisma.session.update({
      where: { id: sessionId },
      data: { questionsCount: { increment: 1 } },
    });

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { questionsCount: { increment: 1 } },
    });

    revalidatePath(`/dashboard/sessions/${sessionId}`);
    return { success: true, question };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Failed to submit question:", error);
    return {
      success: false,
      error: error.message || "Failed to submit question",
    };
  }
}

// Toggle upvote on a question
export async function upvoteQuestion(questionId: string) {
  try {
    const currentUser = await requirePermission("questions", "upvote");

    // Check if user already voted
    const existingVote = await prisma.questionVote.findUnique({
      where: {
        questionId_userId: {
          questionId,
          userId: currentUser.id,
        },
      },
    });

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    if (existingVote) {
      // Remove vote
      await prisma.questionVote.delete({
        where: { id: existingVote.id },
      });

      // Decrement upvotes
      await prisma.question.update({
        where: { id: questionId },
        data: { upvotes: { decrement: 1 } },
      });

      revalidatePath(`/dashboard/sessions/${question.sessionId}`);
      return { success: true, action: "removed" };
    } else {
      // Add vote
      await prisma.questionVote.create({
        data: {
          questionId,
          userId: currentUser.id,
        },
      });

      // Increment upvotes
      await prisma.question.update({
        where: { id: questionId },
        data: { upvotes: { increment: 1 } },
      });

      revalidatePath(`/dashboard/sessions/${question.sessionId}`);
      return { success: true, action: "added" };
    }
  } catch (error: any) {
    console.error("Failed to upvote question:", error);
    return {
      success: false,
      error: error.message || "Failed to upvote question",
    };
  }
}

// Answer a question (Admin)
export async function answerQuestion(questionId: string, answerText: string) {
  try {
    const currentUser = await requirePermission("questions", "answer");

    // Validate answer text
    const validatedData = AnswerSchema.parse({ answer: answerText });

    const questionToCheck = await prisma.question.findUnique({
      where: { id: questionId },
      select: { sabaqId: true, sessionId: true },
    });

    if (!questionToCheck)
      return { success: false, error: "Question not found" };

    // Verify access
    if (currentUser.role !== "SUPERADMIN") {
      const isAssigned = await prisma.sabaqAdmin.findUnique({
        where: {
          sabaqId_userId: {
            sabaqId: questionToCheck.sabaqId,
            userId: currentUser.id,
          },
        },
      });
      const isJanab = await prisma.sabaq.findFirst({
        where: { id: questionToCheck.sabaqId, janabId: currentUser.id },
      });

      if (!isAssigned && !isJanab) {
        return {
          success: false,
          error: "Unauthorized to answer questions for this sabaq",
        };
      }
    }

    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        isAnswered: true,
        answer: validatedData.answer,
        answeredBy: currentUser.id,
        answeredAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            itsNumber: true,
            email: true,
          },
        },
        session: {
          include: {
            sabaq: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    revalidatePath(`/dashboard/sessions/${question.sessionId}`);

    // Queue email notification if user has email
    if (question.user.email) {
      await queueEmail(
        question.user.email,
        "Your Question Has Been Answered",
        "question-answered",
        {
          userName: question.user.name,
          questionText: question.question,
          answerText: validatedData.answer,
          sabaqName: question.session.sabaq.name,
          sessionId: question.sessionId,
          answeredAt: formatDateTime(new Date()),
        }
      );
      // Trigger processing immediately
      void processEmailQueue();
    }

    return { success: true, question };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Failed to answer question:", error);
    return {
      success: false,
      error: error.message || "Failed to answer question",
    };
  }
}

// Delete a question (Admin)
export async function deleteQuestion(questionId: string) {
  try {
    const currentUser = await requirePermission("questions", "delete");

    const questionToCheck = await prisma.question.findUnique({
      where: { id: questionId },
      select: { sabaqId: true },
    });

    if (!questionToCheck)
      return { success: false, error: "Question not found" };

    // Verify access
    if (currentUser.role !== "SUPERADMIN") {
      const isAssigned = await prisma.sabaqAdmin.findUnique({
        where: {
          sabaqId_userId: {
            sabaqId: questionToCheck.sabaqId,
            userId: currentUser.id,
          },
        },
      });
      const isJanab = await prisma.sabaq.findFirst({
        where: { id: questionToCheck.sabaqId, janabId: currentUser.id },
      });

      if (!isAssigned && !isJanab) {
        return {
          success: false,
          error: "Unauthorized to delete questions for this sabaq",
        };
      }
    }

    const question = await prisma.question.delete({
      where: { id: questionId },
    });

    revalidatePath(`/dashboard/sessions/${question.sessionId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete question:", error);
    return {
      success: false,
      error: error.message || "Failed to delete question",
    };
  }
}

// Get all questions for a session
export async function getSessionQuestions(sessionId: string) {
  try {
    const currentUser = await requirePermission("questions", "read");

    // Verify access to session/sabaq
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { sabaqId: true },
    });

    if (!session) return { success: false, error: "Session not found" };

    if (currentUser.role !== "SUPERADMIN") {
      if (
        ["ADMIN", "MANAGER", "JANAB", "ATTENDANCE_INCHARGE"].includes(
          currentUser.role
        )
      ) {
        const isAssigned = await prisma.sabaqAdmin.findUnique({
          where: {
            sabaqId_userId: {
              sabaqId: session.sabaqId,
              userId: currentUser.id,
            },
          },
        });
        const isJanab = await prisma.sabaq.findFirst({
          where: { id: session.sabaqId, janabId: currentUser.id },
        });

        if (!isAssigned && !isJanab) {
          return {
            success: false,
            error: "Unauthorized access to this session",
          };
        }
      } else {
        // Mumin check - must be enrolled
        const isEnrolled = await prisma.enrollment.findUnique({
          where: {
            sabaqId_userId: {
              sabaqId: session.sabaqId,
              userId: currentUser.id,
            },
            status: "APPROVED",
          },
        });
        if (!isEnrolled) {
          return {
            success: false,
            error: "Unauthorized access to this session",
          };
        }
      }
    }

    const questions = await prisma.question.findMany({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            itsNumber: true,
          },
        },
        votes: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
    });

    return { success: true, questions };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch questions",
    };
  }
}

// Get user's voted question IDs for a session
export async function getUserVotes(sessionId: string) {
  try {
    const currentUser = await requirePermission("questions", "read");

    const votes = await prisma.questionVote.findMany({
      where: {
        userId: currentUser.id,
        question: {
          sessionId,
        },
      },
      select: {
        questionId: true,
      },
    });

    const votedQuestionIds = votes.map((v) => v.questionId);
    return { success: true, votedQuestionIds };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch votes" };
  }
}

// Get user's question history
export async function getUserQuestions(userId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const targetUserId = userId || session.user.id;

    // If requesting for another user, check 'read' permission
    // If requesting for self, check 'read_self' permission
    if (targetUserId !== session.user.id) {
      await requirePermission("questions", "read");
    } else {
      await requirePermission("questions", "read_self");
    }

    const questions = await prisma.question.findMany({
      where: { userId: targetUserId },
      include: {
        session: {
          include: {
            sabaq: {
              select: {
                id: true,
                name: true,
                kitaab: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, questions };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch questions",
    };
  }
}

// Get question statistics for a session
export async function getQuestionStats(sessionId: string) {
  try {
    await requirePermission("questions", "read");

    const questions = await prisma.question.findMany({
      where: { sessionId },
    });

    const totalQuestions = questions.length;
    const answeredCount = questions.filter((q) => q.isAnswered).length;
    const pendingCount = totalQuestions - answeredCount;
    const mostUpvoted = questions.reduce(
      (max, q) => (q.upvotes > max.upvotes ? q : max),
      { upvotes: 0, question: "" }
    );

    const stats = {
      totalQuestions,
      answeredCount,
      pendingCount,
      mostUpvoted: mostUpvoted.upvotes > 0 ? mostUpvoted : null,
    };

    return { success: true, stats };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch question stats",
    };
  }
}
