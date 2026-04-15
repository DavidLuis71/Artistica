import "./splash.css";

export default function Splash() {
  return (
    <div className="splash-container">
      <img src="/logo512.png" className="splash-logo" alt="Logo" />
      <div className="splash-loader"></div>
    </div>
  );
}
