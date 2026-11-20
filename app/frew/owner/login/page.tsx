import {redirect} from "next/navigation";
export const dynamic="force-dynamic";
// Old owner email sign-in links now lead straight to the public preview.
export default function LegacyOwnerLogin(){
  redirect("/frew/owner");
}
