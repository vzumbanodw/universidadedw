export type CertificateStatus = "issued" | "in_progress" | "available";

export type Certificate = {
  id: string;
  title: string;
  description: string;
  courseTitle: string;
  status: CertificateStatus;
  progress?: number;
  issuedAt?: string;
  credentialId?: string;
  estimatedMinutes: number;
  skills: string[];
};
