import { RegisterForm } from "@/components/RegisterForm";

export const metadata = {
  title: "Create Account | InvestEase",
  description: "Create a new InvestEase account",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex w-14 h-14 bg-indigo-600 rounded-2xl items-center justify-center mb-6 shadow-sm">
            <span className="text-2xl font-bold text-white">IE</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Create your InvestEase account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Start tracking your investments today
          </p>
        </div>

        <div className="bg-white shadow-md rounded-2xl border border-slate-200 p-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
