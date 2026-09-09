import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerPage } from "./pages/CustomerPage";
import { ApprovalsPage } from "./pages/ApprovalsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/customers"
          element={<CustomersPage />}
        />

        <Route
          path="/customers/:id"
          element={<CustomerPage />}
        />

        <Route
          path="/approvals"
          element={<ApprovalsPage />}
        />

        <Route
          path="/analytics"
          element={<AnalyticsPage />}
        />
      </Route>
    </Routes>
  );
}

export default App;