import dynamic from "next/dynamic";
const AppInitializer = dynamic(() => import("../src/components/AppInitializer"), { ssr: false });
import { AppStateProvider } from "../src/state/AppStateProvider";

export default function Page() {
  return (
    <AppStateProvider>
      <AppInitializer />
    </AppStateProvider>
  );
}
