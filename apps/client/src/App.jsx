import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RequireAuth from "./core/auth/RequireAuth";
import AppLayout from "./core/layout/AppLayout";
import AutoPage from "./pages/truckWeighing/AutoPage";
import ManualPage from "./pages/truckWeighing/ManualPage";
import LoadedPage from "./pages/truckWeighing/LoadedPage";
import UnloadedPage from "./pages/truckWeighing/UnloadedPage";

function App() {
  const Router = window.location.protocol === "file:" ? HashRouter : BrowserRouter;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/truckWeighing/Auto"
          element={
            <RequireAuth>
              <AppLayout>
                <AutoPage />
              </AppLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/truckWeighing/Manual"
          element={
            <RequireAuth>
              <AppLayout>
                <ManualPage />
              </AppLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/truckWeighing/Loaded"
          element={
            <RequireAuth>
              <AppLayout>
                <LoadedPage />
              </AppLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/truckWeighing/Unloaded/:id"
          element={
            <RequireAuth>
              <AppLayout>
                <UnloadedPage />
              </AppLayout>
            </RequireAuth>
          }
        />

        <Route path="/" element={<Navigate to="/truckWeighing/Auto" replace />} />
        <Route path="*" element={<Navigate to="/truckWeighing/Auto" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
