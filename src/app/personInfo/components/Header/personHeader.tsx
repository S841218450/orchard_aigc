import type { ActInfo } from "../personInfoFrame";

export const PersonHeader = ({ actInfo }: { actInfo: ActInfo }) => {
  return (
    <div className="main-header">
      <h1>
        {actInfo.icon}
        {actInfo.title}
      </h1>
      <span className="main-header-desc">{actInfo.desc}</span>
    </div>
  );
};
