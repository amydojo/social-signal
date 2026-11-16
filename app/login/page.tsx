import { redirect } from "next/navigation";

/** Legacy login URL now opens the public, read-only dashboard. */
export default function LoginRedirect() {
  redirect("/");
}
