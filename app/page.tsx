import SubscriptionForm from '@/components/SubscriptionForm'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-8">
          Daily Spiritual Messages
        </h1>
        <p className="mb-8">
          Subscribe to receive daily messages that will help you grow closer to God.
        </p>
        <SubscriptionForm />
      </div>
    </main>
  )
} 