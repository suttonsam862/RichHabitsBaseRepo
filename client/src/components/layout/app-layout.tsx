import { ReactNode } from "react";
import MainSidebar from "./main-sidebar";
import MobileSidebar from "./mobile-sidebar";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
}

const demoUser = {
  id: 1,
  username: "admin",
  fullName: "Charlie Reeves",
  email: "charliereeves@rich-habits.com",
};

export default function AppLayout({ children, title, action }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen h-screen bg-white">
      <MainSidebar user={demoUser} />
      <MobileSidebar user={demoUser} />

      <div className="md:pl-64 lg:pl-72 flex-1 flex flex-col">
        <main className="flex-1 pt-16 md:pt-0 overflow-y-auto min-h-screen">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {(title || action) && (
              <div className="flex justify-between items-center mb-6">
                {title && <h1 className="text-2xl font-bold">{title}</h1>}
                {action}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
