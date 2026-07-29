import { assertAdminOrRedirect } from "@/lib/require-admin";

// Gate admin: esta página consume /api/admin/network/* (solvencia, θ, margen).
// Sin el gate, un miembro llegaba a una pantalla permanentemente en "forbidden".
export default async function AdminSectionLayout({ children }) {
  await assertAdminOrRedirect();
  return children;
}
