import { LoginForm } from "@/components/LoginForm";

export const metadata = {
  title: "Sign In | InvestEase",
  description: "Sign in to your InvestEase account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex w-14 h-14 bg-indigo-600 rounded-2xl items-center justify-center mb-6 shadow-sm">
            <span className="text-2xl font-bold text-white">IE</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">InvestEase</h1>
          <p className="text-slate-500 text-sm font-medium">Smart investing, made simple</p>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-md rounded-2xl border border-slate-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-slate-500 text-sm mb-8">Sign in to your account</p>
          
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 px-4">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
