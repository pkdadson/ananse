import { OrgChart } from "@canvas/react";
import { sampleCompany } from "./sampleCompany.js";

export function App(): JSX.Element {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <OrgChart data={sampleCompany} mode="view" showSearch showMinimap showControls />
    </div>
  );
}
