import { RegisterForm } from "@/components/RegisterForm";

export const metadata = {
  title: "Sign Up | InvestEase",
  description: "Create a new InvestEase account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="mx-auto flex w-14 h-14 bg-indigo-600 rounded-2xl items-center justify-center mb-6 shadow-sm">
            <span className="text-2xl font-bold text-white">IE</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">InvestEase</h1>
          <p className="text-slate-500 text-sm font-medium">Start investing smarter today</p>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-md rounded-2xl border border-slate-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Create account</h2>
          <p className="text-slate-500 text-sm mb-8">Join thousands of investors</p>
          
          <RegisterForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 px-4">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
