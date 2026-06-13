import Navbar from '@/components/Navbar';
import RegistrationForm from '@/components/RegistrationForm';

export default function SignupPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen pt-20 pb-10">
        <section className="max-w-xl mx-auto px-4 pt-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Create Account
            </h1>
            <p className="text-gray-400">
              Sign up with your details and LeetCode ID.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8 neon-border">
            <RegistrationForm />
          </div>
        </section>
      </main>
    </>
  );
}
