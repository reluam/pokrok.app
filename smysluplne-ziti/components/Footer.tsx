import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-playful-outline-base to-playful-outline-light text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-playful-pink-dark/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      
      <div className="max-w-7xl mx-auto container-padding py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-6">Smysluplné žití</h3>
            <p className="text-playful-outline-lighter text-lg leading-relaxed">
              Projekt zaměřený na smysluplné žití, osobní rozvoj a dosahování cílů.
            </p>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-6">Rychlé odkazy</h4>
            <ul className="space-y-3">
              {[
                { href: '/coaching', label: 'Coaching' },
                { href: '/aplikace', label: 'Aplikace' },
                { href: '/inspirace', label: 'Inspirace' },
                { href: '/o-projektu', label: 'O projektu' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-playful-outline-lighter hover:text-white transition-colors text-lg inline-block hover:translate-x-1 transform transition-transform"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-6">Kontakt</h4>
            <p className="text-playful-outline-lighter text-lg leading-relaxed">
              Máte dotaz nebo zájem o spolupráci? Neváhejte nás kontaktovat.
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/20 text-center text-playful-outline-lighter">
          <p className="text-lg">&copy; {new Date().getFullYear()} Smysluplné žití. Všechna práva vyhrazena.</p>
        </div>
      </div>
    </footer>
  )
}
