import { Suspense } from "react";
import AuthCallback from "./AuthCallback";

export default function Page() {
  return (
    <Suspense fallback={<div>Logging you in...</div>}>
      <AuthCallback />
    </Suspense>
  );
}
