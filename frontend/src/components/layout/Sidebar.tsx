import { NavLink } from "react-router-dom";
import { ThemeToggle } from "../ThemeToggle";
import { Icon, ProductMark, type IconName } from "../Icon";

const navigation: { label: string; path: string; icon: IconName }[] = [
  { label: "Dashboard", path: "/dashboard", icon: "dashboard" },
  { label: "Customers", path: "/customers", icon: "customers" },
  { label: "Approvals", path: "/approvals", icon: "approvals" },
  { label: "Analytics", path: "/analytics", icon: "analytics" },
];

export function Sidebar() {
  return <aside className="sidebar">
    <div className="product-identity"><ProductMark /><div><h2>Revenue Recovery <span>OS</span></h2><p>Customer Intelligence</p></div></div>
    <ThemeToggle />
    <div className="navigation-label">Overview</div>
    <nav aria-label="Main navigation">{navigation.map(item =>
      <NavLink key={item.path} to={item.path}><Icon name={item.icon} /><span>{item.label}</span></NavLink>
    )}</nav>
    <div className="sidebar-footer"><span>V1</span><span>Demo environment</span></div>
  </aside>;
}
