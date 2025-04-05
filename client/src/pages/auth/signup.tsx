import SignupForm from "@/components/auth/signup-form";

export default function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-brand-600 dark:text-brand-400">Rich</span> Habits
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create an account to get started
          </p>
        </div>
        
        <SignupForm />
      </div>
    </div>
  );
}
