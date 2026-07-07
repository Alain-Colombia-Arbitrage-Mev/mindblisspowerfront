import { assertAdminOrRedirect } from "@/lib/require-admin";

export default async function AdminSectionLayout({ children }) {
  await assertAdminOrRedirect();
  return children;
}
