import Link from 'next/link';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-coral/20 text-coral-dark flex items-center justify-center font-display font-bold text-2xl mb-4">
        404
      </div>
      <h2 className="font-display font-bold text-2xl text-ink mb-2">Page Not Found</h2>
      <p className="text-sm text-ink-muted max-w-sm mb-6">
        The route you requested does not exist or has been relocated within the MIRA-H application suite.
      </p>
      <Link href="/">
        <Button variant="primary">Return to Overview</Button>
      </Link>
    </div>
  );
}
