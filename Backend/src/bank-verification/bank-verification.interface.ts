export interface VerifyBankParams {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  userName?: string;
  phone?: string;
}

export type NameMatchCategory = 'DIRECT' | 'GOOD' | 'MODERATE' | 'POOR' | 'NO_MATCH';

export interface BankVerificationResult {
  isValid: boolean;
  accountStatus: 'VALID' | 'INVALID' | 'UNKNOWN';
  accountStatusCode?: string;
  registeredName?: string | null;
  nameMatchScore: number;
  nameMatchResult: NameMatchCategory;
  utr?: string | null;
  referenceId?: string | null;
  failureReason?: string | null;
  rawResponse?: any;
}
