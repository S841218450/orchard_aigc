import "./personInfo.scss";
import PersonInfoFrame from "./components/personInfoFrame";
import UserCenterBackground from "@/components/userCenter/pageBackground/pageBackground";

const PersonInfoLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="person-info">
      <UserCenterBackground tone="warm" />
      <div className="person-info-shell">
        <PersonInfoFrame>{children}</PersonInfoFrame>
      </div>
    </div>
  );
};

export default PersonInfoLayout;
