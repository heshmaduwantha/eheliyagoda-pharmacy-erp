import { redirect } from "next/navigation";
import { BootstrapOwnerForm } from "@/modules/admin/bootstrap-owner-form";
import { getBootstrapState } from "@/modules/admin/rbac.service";

export default async function SetupPage() {
  const state = await getBootstrapState();
  if (state.hasUsers) redirect("/login");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f0fdf4_0,transparent_30%),radial-gradient(circle_at_top_right,#e0f2fe_0,transparent_32%),linear-gradient(180deg,#f8fafc_0,#f8fbfa_100%)] px-5 py-10 sm:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <section className="grid w-full gap-8 overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,51,58,.12)] lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative overflow-hidden bg-[linear-gradient(145deg,#064e59_0%,#007a72_55%,#13b994_100%)] p-8 text-white sm:p-10 lg:p-12">
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:42px_42px]" />
            <div className="relative z-10">
              <p className="text-sm font-bold uppercase tracking-[.2em] text-teal-100/80">First-time setup</p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Create the first Owner account</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-teal-50/80">
                This is a safe bootstrap path for a brand-new install. It only works while the database has no users yet.
              </p>
              <div className="mt-8 grid gap-3 text-sm text-teal-50/85">
                <p>Owner receives the full permission set.</p>
                <p>After the first user exists, user creation moves into the authenticated admin module.</p>
                <p>No password hashes or tokens are exposed back to the browser.</p>
              </div>
            </div>
          </div>
          <div className="p-8 sm:p-10 lg:p-12">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.2em] text-teal-700">Bootstrap</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Owner account</h2>
              <p className="mt-2 text-slate-500">Set up the first privileged user before staff login is available.</p>
            </div>
            <div className="mt-8">
              <BootstrapOwnerForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
