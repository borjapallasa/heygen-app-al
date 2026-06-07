"use client";
import React from "react";

export type Account = { credential_uuid: string; label: string };

export type CredentialRecord = {
  api_credentials_uuid: string;
  name?: string | null;
  created_at?: string;
};

type HeyGenAccountPickerModalProps = {
  accounts: Account[];
  onSelect: (credentialUuid: string) => void;
};

export function formatCredentialLabel(
  credential: CredentialRecord,
  index: number
): string {
  if (credential.name?.trim()) {
    return credential.name.trim();
  }
  if (credential.created_at) {
    const date = new Date(credential.created_at);
    const formatted = date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
    return `HeyGen Account (added ${formatted})`;
  }
  return `HeyGen Account ${index + 1}`;
}

export function mapCredentialsToAccounts(
  credentials: CredentialRecord[]
): Account[] {
  return credentials.map((credential, index) => ({
    credential_uuid: credential.api_credentials_uuid,
    label: formatCredentialLabel(credential, index)
  }));
}

export function HeyGenAccountPickerModal({
  accounts,
  onSelect
}: HeyGenAccountPickerModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Choose HeyGen Account
          </h2>
          <p className="text-gray-600 text-sm">
            Multiple HeyGen accounts are linked to this organization. Select one to continue.
          </p>
        </div>

        <div className="space-y-4 mb-4">
          {accounts.map((account) => (
            <button
              key={account.credential_uuid}
              type="button"
              onClick={() => onSelect(account.credential_uuid)}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors font-medium text-gray-900"
            >
              {account.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HeyGenAccountPickerModal;
