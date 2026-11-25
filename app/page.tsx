import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <header className="border-b border-slate-100">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
              T
            </div>
            <span className="text-xl font-bold tracking-tight">
              Task Manager
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-blue-600">
              Features
            </a>
            <a href="#about" className="hover:text-blue-600">
              About
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:block"
            >
              Login
            </Link>

            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Create Task
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 to-white px-6 py-24 sm:py-32">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Simple task management for everyone
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Organize your work.
            <span className="block text-blue-600">Achieve more.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-500 sm:text-lg">
            Take control of your daily tasks with a simple and powerful task
            manager. Stay organized, track your progress, and get more things
            done.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Create Task →
            </Link>

            <a
              href="#features"
              className="rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Explore Features
            </a>
          </div>

          <p className="mt-5 text-sm text-slate-400">
            Simple. Organized. Productive.
          </p>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-blue-100/50 sm:p-8">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  My Workspace
                </p>
                <h2 className="mt-2 text-2xl font-bold">Manage your tasks.</h2>
              </div>

              <div className="hidden rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 sm:block">
                Dashboard Preview
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs text-slate-500 sm:text-sm">Total Tasks</p>
                <p className="mt-2 text-2xl font-bold">12</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs text-slate-500 sm:text-sm">Completed</p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">8</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs text-slate-500 sm:text-sm">Pending</p>
                <p className="mt-2 text-2xl font-bold text-orange-500">4</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-6 rounded-xl border border-slate-100 p-5">
              <div className="mb-3 flex justify-between">
                <span className="text-sm font-semibold">Your progress</span>
                <span className="text-sm font-bold text-blue-600">67%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-2/3 rounded-full bg-blue-600" />
              </div>
            </div>

            {/* Example tasks */}
            <div className="mt-6">
              <h3 className="mb-4 font-semibold">Your Tasks</h3>

              {[
                { title: "Complete project design", done: true },
                { title: "Prepare weekly report", done: true },
                { title: "Learn new technologies", done: false },
              ].map((task, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 border-t border-slate-100 py-4"
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                      task.done
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300"
                    }`}
                  >
                    {task.done && <span className="text-xs">✓</span>}
                  </div>

                  <span
                    className={`text-sm ${
                      task.done
                        ? "text-slate-400 line-through"
                        : "font-medium text-slate-700"
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Features
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to stay organized.
            </h2>

            <p className="mt-4 leading-7 text-slate-500">
              Manage your daily activities with simple and useful tools.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "✓",
                title: "Task Management",
                description:
                  "Create, complete and delete tasks easily from one place.",
              },
              {
                icon: "⌕",
                title: "Search & Filter",
                description:
                  "Quickly find tasks and organize them by their status.",
              },
              {
                icon: "↗",
                title: "Track Progress",
                description:
                  "See your completed and pending tasks at a glance.",
              },
              {
                icon: "▣",
                title: "Personal Account",
                description: "Keep your tasks connected to your own account.",
              },
              {
                icon: "◈",
                title: "Secure Access",
                description:
                  "Sign in securely and access your personal workspace.",
              },
              {
                icon: "◎",
                title: "Simple Interface",
                description:
                  "Enjoy a clean, responsive experience across devices.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-100/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl font-bold text-blue-600">
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-lg font-bold">{feature.title}</h3>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / CTA */}
      <section id="about" className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl bg-blue-600 px-7 py-16 text-center text-white shadow-xl shadow-blue-200 sm:px-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to get things done?
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-blue-100">
            Start organizing your day with your own personal task manager.
            Create your account and take the first step.
          </p>

          <Link
            href="/login"
            className="mt-9 inline-flex rounded-xl bg-white px-8 py-4 font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Create Task →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
              T
            </div>
            <span className="font-bold">Task Manager</span>
          </div>

          <p className="text-sm text-slate-400">
            © 2026 Task Manager. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
