// Utility to map internal role codes to user-friendly display names.
// Usage: roleDisplay(user.role)
export default function roleDisplay(role) {
  if (role === 'worker') return 'Freelancer';
  if (role === 'employer') return 'Client';
  return role?.charAt(0).toUpperCase() + role?.slice(1);
}
