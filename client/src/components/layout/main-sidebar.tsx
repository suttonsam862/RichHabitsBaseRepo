import { Link } from "wouter";
import { useLocation } from "wouter";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

const SidebarLink = ({ href, icon, children, active }: SidebarLinkProps) => {
  return (
    <Link href={href}>
      <a
        className={`flex items-center py-2 px-3 text-sm rounded-md ${
          active
            ? "bg-primary-50 text-primary font-medium"
            : "hover:bg-muted text-foreground"
        }`}
      >
        <span className="h-5 w-5 mr-2 text-muted-foreground">{icon}</span>
        {children}
      </a>
    </Link>
  );
};

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

const SidebarSection = ({ title, children }: SidebarSectionProps) => {
  return (
    <div className="mt-8">
      <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h2>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
};

interface MainSidebarProps {
  user?: {
    id: number;
    username: string;
    fullName?: string;
    email?: string;
    avatarUrl?: string;
  };
}

export default function MainSidebar({ user }: MainSidebarProps) {
  const [location] = useLocation();

  return (
    <aside className="md:w-64 lg:w-72 flex-col fixed inset-y-0 z-50 border-r bg-white shadow-sm hidden md:flex">
      <div className="flex h-16 items-center px-4 border-b bg-white">
        <Link href="/">
          <a className="text-lg font-bold">
            <span className="text-primary">Rich</span> Habits
          </a>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="px-2 py-4">
          <div className="space-y-1">
            <SidebarLink
              href="/"
              active={location === "/"}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              }
            >
              Dashboard
            </SidebarLink>
            <SidebarLink
              href="/leads"
              active={location === "/leads"}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
              }
            >
              Leads
            </SidebarLink>
            <SidebarLink
              href="/orders"
              active={location === "/orders"}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            >
              Orders
            </SidebarLink>
            <SidebarLink
              href="/camps"
              active={location.startsWith("/camps")}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              }
            >
              Camp Management
            </SidebarLink>
          </div>

          <SidebarSection title="Admin">
            <SidebarLink
              href="/settings"
              active={location === "/settings"}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            >
              Settings
            </SidebarLink>
            <SidebarLink
              href="/reports"
              active={location === "/reports"}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            >
              Reports
            </SidebarLink>
          </SidebarSection>
        </nav>
      </div>
      <div className="p-4 border-t">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
            {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.fullName || user?.username || "User"}</p>
            <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
          </div>
          <button className="ml-auto text-muted-foreground hover:text-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
