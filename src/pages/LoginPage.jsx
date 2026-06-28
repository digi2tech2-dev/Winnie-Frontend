import LoginCard from "../components/LoginCard";

export default function LoginPage({ onNavigate }) {
  return (
    <div className="grid min-h-[calc(100vh-140px)] place-items-center py-8">
      <div className="absolute inset-0 -z-10 bg-grid-fade bg-[length:42px_42px] opacity-60" />
      <LoginCard onNavigate={onNavigate} />
    </div>
  );
}
