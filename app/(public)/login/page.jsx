import LoginCard from "@/components/LoginCard/page";
import {redirect} from "next/navigation";

export default function LoginPage() {
  redirect("/");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoginCard />
    </div>
  );
}