import { useNavigate } from 'react-router';
import { authClient } from '@/lib/auth-client';

/** Ends the session, then lands on /login. */
export function SignOutButton({
  ref,
  onClick,
  ...props
}: React.ComponentProps<'button'>) {
  const navigate = useNavigate();
  return (
    <button
      ref={ref}
      type="button"
      onClick={async (e) => {
        onClick?.(e);
        await authClient.signOut();
        navigate('/login');
      }}
      {...props}
    />
  );
}
