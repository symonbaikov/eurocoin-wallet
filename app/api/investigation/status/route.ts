import { NextRequest, NextResponse } from "next/server";
import { getAllInternalRequests } from "@/lib/database/queries";

interface InvestigationStage {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

const stageLabels: Record<string, string> = {
  submitted: "Заявка подана",
  checking: "Проверка документов",
  analyzing: "Анализ транзакций",
  investigating: "Расследование",
  recovering: "Восстановление средств",
  completed: "Завершено",
};

function getStagesFromStatus(status: string): InvestigationStage[] {
  const allStages = [
    { id: "submitted", label: stageLabels.submitted, completed: false, current: false },
    { id: "checking", label: stageLabels.checking, completed: false, current: false },
    { id: "analyzing", label: stageLabels.analyzing, completed: false, current: false },
    { id: "investigating", label: stageLabels.investigating, completed: false, current: false },
    { id: "recovering", label: stageLabels.recovering, completed: false, current: false },
    { id: "completed", label: stageLabels.completed, completed: false, current: false },
  ];

  // Map status to stage
  if (status === "completed") {
    allStages.forEach((stage) => {
      stage.completed = true;
      stage.current = false;
    });
    allStages[allStages.length - 1].current = true;
  } else if (status === "pending") {
    allStages[0].completed = true;
    allStages[1].current = true;
  } else if (status === "processing") {
    allStages[0].completed = true;
    allStages[1].completed = true;
    allStages[2].completed = true;
    allStages[3].current = true;
  }

  return allStages;
}

export async function GET(request: NextRequest) {
  try {
    const requestId = request.nextUrl.searchParams.get("requestId");

    // Get latest internal request if no ID provided
    const requests = await getAllInternalRequests();

    if (requests.length === 0) {
      // Return mock data if no requests
      const mockStages: InvestigationStage[] = [
        { id: "submitted", label: "Заявка подана", completed: true, current: false },
        { id: "checking", label: "Проверка документов", completed: true, current: false },
        { id: "analyzing", label: "Анализ транзакций", completed: true, current: true },
        { id: "investigating", label: "Расследование", completed: false, current: false },
        { id: "recovering", label: "Восстановление средств", completed: false, current: false },
        { id: "completed", label: "Завершено", completed: false, current: false },
      ];

      return NextResponse.json({
        stages: mockStages,
        progress: 50,
        requestId: null,
      });
    }

    // Use latest or specific request
    const targetRequest = requestId ? requests.find((r) => r.id === requestId) : requests[0];

    if (!targetRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const stages = getStagesFromStatus(targetRequest.status);
    const completedCount = stages.filter((s) => s.completed).length;
    const progress = Math.round((completedCount / stages.length) * 100);

    return NextResponse.json({
      stages,
      progress,
      requestId: targetRequest.id,
    });
  } catch (error) {
    console.error("Error fetching investigation status:", error);
    return NextResponse.json({ error: "Failed to fetch investigation status" }, { status: 500 });
  }
}
