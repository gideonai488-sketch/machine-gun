import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FalconIcon from '@/components/icons/FalconIcon'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <FalconIcon className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-slate-500 mb-6">This page doesn't exist. Let's get you back on track.</p>
        <Button asChild className="gap-2">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
