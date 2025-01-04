import { Home } from 'lucide-react'

interface LogoProps {
  variant?: 'default' | 'white'
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ variant = 'default', size = 'md' }: LogoProps) {
  const sizes = {
    sm: {
      container: 'h-8',
      icon: 'h-5 w-5',
      text: 'text-lg'
    },
    md: {
      container: 'h-10',
      icon: 'h-6 w-6',
      text: 'text-xl'
    },
    lg: {
      container: 'h-12',
      icon: 'h-7 w-7',
      text: 'text-2xl'
    }
  }

  const variants = {
    default: {
      icon: 'text-orange-500',
      text: 'text-gray-900'
    },
    white: {
      icon: 'text-white',
      text: 'text-white'
    }
  }

  return (
    <div className={`flex items-center ${sizes[size].container}`}>
      <div className="flex items-center gap-2">
        <div className={`${variants[variant].icon} transform -rotate-12`}>
          <Home className={sizes[size].icon} strokeWidth={2.5} />
        </div>
        <span className={`${variants[variant].text} ${sizes[size].text} font-bold tracking-tight`}>
          Homely
        </span>
      </div>
      <div className={`${variants[variant].text} text-xs font-medium ml-1 mt-3`}>
        eats
      </div>
    </div>
  )
} 