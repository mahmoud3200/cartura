type GoogleProfileNameInput = {
  given_name?: string | null;
  family_name?: string | null;
  name?: string | null;
  email?: string | null;
};

export function getGoogleProfileNames(profile: GoogleProfileNameInput) {
  const givenName = normalizeName(profile.given_name);
  const familyName = normalizeName(profile.family_name);
  const displayName = normalizeName(profile.name);
  const displayNameParts = displayName?.split(/\s+/) ?? [];
  const emailName = normalizeName(profile.email?.split("@")[0]);

  const firstName = givenName ?? displayNameParts[0] ?? emailName ?? "Google";
  const displayFamilyName = displayNameParts.length > 1
    ? displayNameParts.slice(1).join(" ")
    : undefined;
  const lastName = familyName ?? displayFamilyName ?? firstName;

  return {
    firstName,
    lastName,
  };
}

function normalizeName(value: string | null | undefined) {
  const normalized = value?.trim().replace(/\s+/g, " ");

  return normalized || undefined;
}
