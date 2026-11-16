import { Suspense } from "react";
import { SummaryView } from "@/components/SummaryView";

export default function Page() {
  return (
    <Suspense>
      <SummaryView />
    </Suspense>
  );
}
