export interface NavItem {
  href: string;
  label: string;
}

export function getNavItems({ isAdmin }: { isAdmin: boolean }): NavItem[] {
  if (isAdmin) {
    return [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/admin/parents', label: 'Parents' },
      { href: '/admin/teachers', label: 'Teachers' },
      { href: '/admin/admins/new', label: 'Add admin' },
      { href: '/admin/books/new', label: 'Add book' },
      { href: '/voice-profiles', label: 'Voice recordings' },
      { href: '/children', label: 'Children' },
      { href: '/books', label: 'Books' },
      { href: '/leaderboard', label: 'Leaderboard' },
      { href: '/account', label: 'My account' },
    ];
  }
  return [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/children', label: 'Children' },
    { href: '/books', label: 'Books' },
    { href: '/voice-profiles', label: 'Voice profiles' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/account', label: 'My account' },
  ];
}
