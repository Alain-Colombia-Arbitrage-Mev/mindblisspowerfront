import LegacyMemberPage from "../_components/LegacyMemberPage";
import MyPositionPanel from "./MyPositionPanel";

export default function NetworkPage() {
  return (
    <div>
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <MyPositionPanel />
      </div>
      <LegacyMemberPage page="network" />
    </div>
  );
}
