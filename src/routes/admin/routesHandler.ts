import Koa from "koa";

import { Result } from "ownd-vci/dist/types";
import {
  handleNotSuccessResult,
  NotSuccessResult,
} from "ownd-vci/dist/routes/common.js";
import {
  generateRandomNumericString,
  generateRandomString,
} from "ownd-vci/dist/utils/randomStringUtils.js";
import { generatePreAuthCredentialOffer } from "ownd-vci/dist/oid4vci/CredentialOffer.js";

import store, { NewAffiliation } from "../../store.js";

export async function handleNewAffiliation(ctx: Koa.Context) {
  if (!ctx.request.body) {
    ctx.body = { status: "error", message: "Invalid data received!" };
    ctx.status = 400;
    return;
  }
  const affiliation = ctx.request.body.affiliation;

  const result = await registerAffiliation(affiliation);
  if (result.ok) {
    ctx.body = result.payload;
    ctx.status = 201;
  } else {
    handleNotSuccessResult(result.error, ctx);
  }
}

export async function handleAffiliationIDCredentialOffer(ctx: Koa.Context) {
  const { affiliationID: affiliationID } = ctx.params;
  const result = await credentialOfferForAffiliation(affiliationID);
  if (result.ok) {
    ctx.body = result.payload;
    ctx.status = 201;
  } else {
    handleNotSuccessResult(result.error, ctx);
  }
}

const registerAffiliation = async (
  payload: any,
): Promise<Result<NewAffiliation, NotSuccessResult>> => {
  try {
    if (typeof payload !== "object" || !payload) {
      return { ok: false, error: { type: "INVALID_PARAMETER" } };
    }

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
    } = payload;

    if (
      typeof givenName !== "string" ||
      typeof familyName !== "string" ||
      typeof portrait !== "string" ||
      typeof organizationName !== "string" ||
      typeof organizationCountry !== "string" ||
      typeof organizationStateProvince !== "string" ||
      typeof organizationLocality !== "string" ||
      typeof organizationBusinessCategory !== "string" ||
      typeof organizationSerialNumber !== "string" ||
      typeof organizationUrl !== "string" ||
      typeof snsX !== "string" ||
      typeof snsFacebook !== "string" ||
      typeof snsBluesky !== "string" ||
      typeof snsHatena !== "string" ||
      typeof snsInstagram !== "string" ||
      typeof snsYoutube !== "string" ||
      typeof authenticationType !== "string"
    ) {
      return { ok: false, error: { type: "INVALID_PARAMETER" } };
    }

    const newAffiliation: NewAffiliation = {
      givenName,
      familyName,
      portrait,
      title,
      organizationName: organizationName,
      organizationUnitName: organizationUnitName,
      organizationCountry: organizationCountry,
      organizationStateProvince: organizationStateProvince,
      organizationLocality: organizationLocality,
      organizationBusinessCategory: organizationBusinessCategory,
      organizationSerialNumber: organizationSerialNumber,
      organizationUrl: organizationUrl,
      snsX: snsX,
      snsFacebook: snsFacebook,
      snsBluesky: snsBluesky,
      snsHatena: snsHatena,
      snsInstagram: snsInstagram,
      snsYoutube: snsYoutube,
      authenticationType: authenticationType,
    };

    // Execute store.registerAffiliation
    await store.registerAffiliation(newAffiliation);

    return { ok: true, payload: newAffiliation };
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      return {
        ok: false,
        error: { type: "INTERNAL_ERROR", message: e.message },
      };
    } else {
      return { ok: false, error: { type: "INTERNAL_ERROR", message: "" } };
    }
  }
};

export type GenerateCredentialOfferResult = {
  subject: any;
  credentialOffer: string;
  txCode: string;
};

const credentialOfferForAffiliation = async (
  affiliationID: string,
): Promise<Result<GenerateCredentialOfferResult, NotSuccessResult>> => {
  const affiliation = await store.getAffiliationByID(affiliationID);
  if (!affiliation) {
    return { ok: false, error: { type: "NOT_FOUND" } };
  }

  // generate pre-auth code
  const code = generateRandomString();
  const expiresIn = Number(process.env.VCI_PRE_AUTH_CODE_EXPIRES_IN || "86400");
  const txCode = generateRandomNumericString();
  await store.addPreAuthCode(code, expiresIn, txCode, affiliation.id);

  const credentialOfferUrl = generatePreAuthCredentialOffer(
    process.env.CREDENTIAL_ISSUER || "",
    ["OrganizationalAffiliationCertificate"],
    code,
    {},
  );

  const payload = {
    subject: { affiliationID: affiliationID },
    credentialOffer: credentialOfferUrl,
    txCode,
  };
  return { ok: true, payload };
};

export default {
  handleNewAffiliation,
  handleAffiliationIDCredentialOffer,
};
