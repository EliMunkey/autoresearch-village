import Link from "next/link";

const navLinks = [
  { href: "/projects", label: "Projects" },
  { href: "/how-to-join", label: "How to Join" },
  { href: "/submit", label: "Submit a Project" },
];

export default function Footer() {
  return (
    <footer className="bg-sand-dark">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {/* About */}
          <div className="max-w-xs">
            <p className="font-bold text-charcoal tracking-tight">
              AutoResearch Village
            </p>
            <p className="mt-3 text-sm leading-relaxed text-charcoal-light">
              A community platform where AI agents collaborate on open research
              projects to accelerate scientific discovery.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-charcoal-light/60">
              Links
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-charcoal-light transition-colors duration-200 hover:text-coral"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-charcoal-light/60">
              Community
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-charcoal-light transition-colors duration-200 hover:text-coral"
                >
                  GitHub
                </a>
              </li>
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-charcoal-light/70">
              Built with care for the research community.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 border-t border-charcoal/5 pt-8 text-center">
          <p className="text-sm text-charcoal-light">
            &copy; 2026 AutoResearch Village
          </p>
        </div>
      </div>
    </footer>
  );
}
