import { redirect } from '@remix-run/node';

export async function loader() {
  // Redirect to the app route
  return redirect('/app');
}

