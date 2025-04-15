import { Button } from '@/components/ui/button'
import {} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthContainer } from './auth/container'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <AuthContainer>
      <form className="p-6 md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground text-balance">
              Login to your Bugdet account
            </p>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="grid gap-3">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <a
                href="https://google.com"
                className="ml-auto text-sm underline-offset-2 hover:underline"
              >
                Forgot your password?
              </a>
            </div>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
          <div className="text-center text-sm">
            Don&apos;t have an account?{' '}
            <a
              href="https://google.com"
              className="underline underline-offset-4"
            >
              Sign up
            </a>
          </div>
        </div>
      </form>
    </AuthContainer>
  )
}
