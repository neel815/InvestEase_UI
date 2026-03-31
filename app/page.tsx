import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-16">
      <div className="text-center space-y-8 max-w-5xl w-full">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-slate-900">
            Welcome to InvestEase
          </h1>
          <p className="text-xl text-slate-500">
            Track your investments with ease and confidence
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold transition"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-8 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold transition"
          >
            Create Account
          </Link>
        </div>

        <div className="pt-8 border-t border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-2 text-left">
              <h3 className="font-semibold text-slate-900">Portfolio Tracking</h3>
              <p className="text-slate-500">
                Monitor all your investments in one place
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-2 text-left">
              <h3 className="font-semibold text-slate-900">Real-time Updates</h3>
              <p className="text-slate-500">
                Get instant updates on market movements
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-2 text-left">
              <h3 className="font-semibold text-slate-900">Analytics</h3>
              <p className="text-slate-500">
                Analyze your investment performance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
