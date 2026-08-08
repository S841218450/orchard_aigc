import "./pageBackground.scss";

export type UserCenterBgTone = "warm" | "gold" | "green" | "cyan";

const UserCenterBackground = ({ tone = "warm" }: { tone?: UserCenterBgTone }) => {
  return (
    <div className="user-center-bg" data-tone={tone} aria-hidden="true">
      <div className="uc-bg-base" />
      <div className="uc-bg-glow uc-bg-glow-1" />
      <div className="uc-bg-glow uc-bg-glow-2" />
      <div className="uc-bg-glow uc-bg-glow-3" />
      <div className="uc-bg-dots" />
      <div className="uc-bg-rings">
        <span className="uc-ring uc-ring-1" />
        <span className="uc-ring uc-ring-2" />
        <span className="uc-ring uc-ring-3" />
        <span className="uc-ring uc-ring-4" />
      </div>
      <div className="uc-bg-vignette" />
    </div>
  );
};

export default UserCenterBackground;
