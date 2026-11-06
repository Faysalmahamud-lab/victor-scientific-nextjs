import Image from "next/image";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function AdminLoginPage(){if(await getAdminSession())redirect("/admin");return <main className="login-page"><section className="login-card"><Image className="admin-login-logo" src="/brand/logo.webp" alt="Victor Scientific" width={170} height={55}/><h1>Admin sign in</h1><p>Use an existing administrator account. Access is limited to the email allowlist configured on the server.</p><AdminLoginForm/></section></main>;}
