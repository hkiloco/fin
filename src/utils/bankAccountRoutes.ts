/**
 * Convert account name to URL-safe slug
 * e.g., "Personal Checking" -> "personal-checking"
 */
export const createAccountSlug = (accountName: string): string => {
  return accountName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

/**
 * Find bank account by slug
 */
export const findAccountBySlug = (accounts: any[], slug: string): any | null => {
  return accounts.find(account => 
    createAccountSlug(account.name) === slug
  ) || null;
};

/**
 * Create bank account route name
 * e.g., "Personal Checking" -> "bank-personal-checking"
 */
export const createBankAccountRoute = (accountName: string): string => {
  return `bank-${createAccountSlug(accountName)}`;
};
