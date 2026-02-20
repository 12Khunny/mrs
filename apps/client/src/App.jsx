import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./page/auth/LoginPage";
import RequireAuth from "./core/auth/RequireAuth";
import AppLayout from "./core/layout/AppLayout";
import AutoPage from "./page/truckWeighing/AutoPage";
import ManualPage from "./page/truckWeighing/ManualPage";
import LoadedPage from "./page/truckWeighing/LoadedPage";
import UnloadedPage from "./page/truckWeighing/UnloadedPage";

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
