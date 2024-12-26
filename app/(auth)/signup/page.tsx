// app/(auth)/signup/page.tsx
// This file is used to handle the signup page
// It is used to create a new user account

import SignupForm from './SignupForm';

export default function SignupPage() {
  return (
    <div className="container mx-auto py-10">
      <SignupForm />
    </div>
  );
}
