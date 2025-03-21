import * as jose from "jose";

import store from "../store.js";
import keyStore from "ownd-vci/dist/store/keyStore.js";
import { issueFlatCredential } from "ownd-vci/dist/credentials/sd-jwt/issuer.js";
import { ErrorPayload, Result } from "ownd-vci/dist/types";

/*
    現実装における、snake_case と camel caseの混在について

    1. /admin/affiliation/new が受け取るjsonについて -> camel case
    2. データベースのカラムについて                    -> snake case
    3. VCに記載するカラムについて                     ->  snake case
 */

const issueAffiliationCredential = async (
  authorizedCode: string,
  jwk: jose.JWK,
): Promise<Result<string, ErrorPayload>> => {
  const data = await store.getPreAuthCodeAndAffiliation(authorizedCode);
  if (!data) {
    return { ok: false, error: { error: "NotFound" } }; // todo define constant
  }
  const { affiliation } = data;
  const keyPair = await keyStore.getLatestKeyPair();
  if (keyPair) {
    const { x509cert } = keyPair;
    const x5c = x509cert ? JSON.parse(x509cert) : [];
    // issue vc
    const iss = process.env.CREDENTIAL_ISSUER_IDENTIFIER;
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60 * 24 * 365;
    const vct = "OrganizationalAffiliationCertificate";
    const {
      givenName,
      familyName,
      portrait,
      title,
      organizationName,
      organizationUnitName,
      organizationCountry,
      organizationStateProvince,
      organizationLocality,
      organizationBusinessCategory,
      organizationSerialNumber,
      organizationUrl,
      snsX,
      snsFacebook,
      snsBluesky,
      snsHatena,
      snsInstagram,
      snsYoutube,
      authenticationType,
    } = affiliation;
    const claims = {
      given_name: givenName,
      family_name: familyName,
      portrait,
      title,
      organization_name: organizationName,
      organization_unit_name: organizationUnitName,
      organization_country: organizationCountry,
      organization_state_province: organizationStateProvince,
      organization_locality: organizationLocality,
      organization_business_category: organizationBusinessCategory,
      organization_serial_number: organizationSerialNumber,
      organization_url: organizationUrl,
      sns_x: snsX,
      sns_facebook: snsFacebook,
      sns_bluesky: snsBluesky,
      sns_hatena: snsHatena,
      sns_instagram: snsInstagram,
      sns_youtube: snsYoutube,
      authentication_type: authenticationType,
      cnf: { jwk },
      vct,
      iss,
      iat,
      exp,
    };
    const credential = await issueFlatCredential(claims, keyPair, x5c);
    return { ok: true, payload: credential };
  } else {
    const error = { status: 500, error: "No keypair exists" };
    return { ok: false, error };
  }
};

export default {
  issueAffiliationCredential,
};
