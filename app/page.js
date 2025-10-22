import dynamic from "next/dynamic";
const AppRoot = dynamic(() => import("../src/components/AppRoot"), { ssr: false });
import { AppStateProvider } from "../src/state/AppStateProvider";

export default function Page() {
  return (
    <AppStateProvider>
      <AppRoot />
    </AppStateProvider>
  );
}
