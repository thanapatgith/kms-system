import SupervisorNavbar from "@/components/SupervisorNavbar";

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {children}
      <SupervisorNavbar />
    </div>
  );
}