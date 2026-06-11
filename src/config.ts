// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
export interface MedplumAppConfig {
  baseUrl?: string;
  googleClientId?: string;
  clientId?: string;
}

// CKM (Cardio-Reno-Metabolismo) usa una instancia self-hosted de Medplum.
// La baseUrl se puede sobreescribir con MEDPLUM_BASE_URL en .env (ver .env.defaults).
const DEFAULT_BASE_URL = 'https://api.medplum.com.ar';

const config: MedplumAppConfig = {
  baseUrl: import.meta.env?.MEDPLUM_BASE_URL || DEFAULT_BASE_URL,
  googleClientId: import.meta.env?.GOOGLE_CLIENT_ID || undefined,
  clientId: import.meta.env?.MEDPLUM_CLIENT_ID || undefined,
};

export function getConfig(): MedplumAppConfig {
  return config;
}
