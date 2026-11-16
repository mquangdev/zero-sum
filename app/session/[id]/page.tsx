import { Suspense } from "react";
import { SessionView } from "@/components/SessionView";

export default function Page() {
  return (
    <Suspense>
      <SessionView />
    </Suspense>
  );
}
