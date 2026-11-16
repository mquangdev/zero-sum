import { Suspense } from "react";
import { RoundFormView } from "@/components/RoundFormView";

export default function Page() {
  return (
    <Suspense>
      <RoundFormView />
    </Suspense>
  );
}
