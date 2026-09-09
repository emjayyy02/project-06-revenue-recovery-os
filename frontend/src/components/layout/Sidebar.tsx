import { NavLink } from "react-router-dom";

const navigation = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Customers", path: "/customers" },
  { label: "Approvals", path: "/approvals" },
  { label: "Analytics", path: "/analytics" },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <h2>Revenue Recovery OS</h2>
        <p>Customer Intelligence</p>
      </div>

      <nav>
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}