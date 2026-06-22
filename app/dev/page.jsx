import DevConsole from "@/components/DevConsole";
import ProtectedRoute from "@/components/ProtectedRoute";
import { USER_ROLES } from "@/constants";

export default function DevPage() {
  return (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
      <DevConsole />
    </ProtectedRoute>
  );
}
