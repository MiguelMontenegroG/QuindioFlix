'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import ReproductorContent from './reproductor-content'

export default function ReproductorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-accent animate-spin" />
        </div>
      }
    >
      <ReproductorContent />
    </Suspense>
  )
}
