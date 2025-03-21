import store from "ownd-vci/dist/store.js";
import keyStore from "ownd-vci/dist/store/keyStore.js";
import authStore, {
  StoredAccessToken,
  TBL_NM_AUTH_CODES,
} from "ownd-vci/dist/store/authStore.js";
import {
  Identifiable,
  AuthorizedCode,
} from "ownd-vci/dist/oid4vci/types/types.js";
import {objectToCamel} from "ts-case-convert";

/*
@startuml
https://www.notion.so/VC-464f3501afc34cd1b5ac7db716373425
entity Affiliation {
  * id: int
  --
  *  given_name string
  *  family_name string
  *  portrait string
  *  title string
  *  organization_name string
  *  organization_unit_name string
  *  organization_country string
  *  organization_state_province string
  *  organization_locality string
  *  organization_business_category string
  *  organization_serial_number string
  *  organization_url string
  *  sns_x string
  *  sns_facebook string
  *  sns_bluesky string
  *  sns_hatena string
  *  sns_instagram string
  *  sns_youtube string
  *  authentication_type string
  *  createdAt datetime
  *  updatedAt datetime
}

entity auth_codes_affiliation {
  * auth_code_id <<FK>>
  * affiliation_id <<FK>>
  --
  * created_at: datetime
}
@enduml
*/

const TBL_NM_AFFILIATION = "affiliation";
const TBL_NM_AUTH_CODES_AFFILIATION = "auth_codes_affiliation";
const DDL_AFFILIATION = `
  CREATE TABLE ${TBL_NM_AFFILIATION} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    given_name VARCHAR(255),
    family_name VARCHAR(255),
    portrait TEXT,
    title VARCHAR(255),
    organization_name VARCHAR(255),
    organization_unit_name VARCHAR(255),
    organization_country VARCHAR(10),
    organization_state_province VARCHAR(255),
    organization_locality VARCHAR(255),
    organization_business_category VARCHAR(255),
    organization_serial_number VARCHAR(255),
    organization_url VARCHAR(255),
    sns_x VARCHAR(255),
    sns_facebook VARCHAR(255),
    sns_bluesky VARCHAR(255),
    sns_hatena VARCHAR(255),
    sns_instagram VARCHAR(255),
    sns_youtube VARCHAR(255),
    authentication_type VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`.trim();
const DDL_PRE_AUTH_CODES_AFFILIATION = `
  CREATE TABLE ${TBL_NM_AUTH_CODES_AFFILIATION} (
    auth_code_id INTEGER,
    affiliation_id INTEGER,
    PRIMARY KEY (auth_code_id, affiliation_id),
    FOREIGN KEY (auth_code_id) REFERENCES ${TBL_NM_AUTH_CODES}(id),
    FOREIGN KEY (affiliation_id) REFERENCES ${TBL_NM_AFFILIATION}(id)
  )
`.trim();

const DDL_MAP = {
  [TBL_NM_AFFILIATION]: DDL_AFFILIATION,
  [TBL_NM_AUTH_CODES_AFFILIATION]: DDL_PRE_AUTH_CODES_AFFILIATION,
};
const createDb = async () => {
  await keyStore.createDb();
  await authStore.createDb();
  await store.createDb(DDL_MAP);
};
const destroyDb = async () => {
  await keyStore.destroyDb();
  await authStore.destroyDb();
  await store.destroyDb(DDL_MAP);
};

export interface Affiliation {
  id: number;
  givenName: string;
  familyName: string;
  portrait: string;
  title: string;
  organizationName: string;
  organizationUnitName: string;
  organizationCountry: string;
  organizationStateProvince: string;
  organizationLocality: string;
  organizationBusinessCategory: string;
  organizationSerialNumber: string;
  organizationUrl: string;
  snsX: string;
  snsFacebook: string;
  snsBluesky: string;
  snsHatena: string;
  snsInstagram: string;
  snsYoutube: string;
  authenticationType: string;
}
export type NewAffiliation = Omit<Affiliation, "id">;

export const registerAffiliation = async (
  newAffiliation: NewAffiliation,
): Promise<void> => {
  const db = await store.openDb();
  const sql = `
    INSERT INTO
    ${TBL_NM_AFFILIATION} (
        given_name,
        family_name,
        portrait,
        title,
        organization_name,
        organization_unit_name,
        organization_country,
        organization_state_province,
        organization_locality,
        organization_business_category,
        organization_serial_number,
        organization_url,
        sns_x,
        sns_facebook,
        sns_bluesky,
        sns_hatena,
        sns_instagram,
        sns_youtube,
        authentication_type
    )
VALUES
    ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
  `;
  const params = [
    newAffiliation.givenName,
    newAffiliation.familyName,
    newAffiliation.portrait,
    newAffiliation.title,
    newAffiliation.organizationName,
    newAffiliation.organizationUnitName,
    newAffiliation.organizationCountry,
    newAffiliation.organizationStateProvince,
    newAffiliation.organizationLocality,
    newAffiliation.organizationBusinessCategory,
    newAffiliation.organizationSerialNumber,
    newAffiliation.organizationUrl,
    newAffiliation.snsX,
    newAffiliation.snsFacebook,
    newAffiliation.snsBluesky,
    newAffiliation.snsHatena,
    newAffiliation.snsInstagram,
    newAffiliation.snsYoutube,
    newAffiliation.authenticationType,
  ];

  try {
    await db.run(sql, params);
    console.log("New affiliation inserted");
  } catch (err) {
    console.error("Could not insert new affiliation", err);
    throw err;
  }
};

export const getAffiliationByID = async (affiliationID: string) => {
  try {
    const db = await store.openDb();
    console.log(`retrieving affiliation by id : ${affiliationID}`)
    // workaround. todo: The use of camel case and snake case should be reviewed comprehensively.
    const tmp = await db.get<object>(
      `SELECT * FROM ${TBL_NM_AFFILIATION} WHERE id = ?`,
      affiliationID,
    );
    const affiliation = objectToCamel(tmp) as Affiliation
    return affiliation || null;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const addPreAuthCode = async (
  code: string,
  expiresIn: number,
  txCode: string,
  affiliationId: number,
) => {
  try {
    const db = await store.openDb();
    const authCodeId = await authStore.addAuthCode(
      code,
      expiresIn,
      true,
      txCode,
      true,
    );
    await db.run(
      `INSERT INTO ${TBL_NM_AUTH_CODES_AFFILIATION} (auth_code_id, affiliation_id) VALUES (?, ?)`,
      authCodeId,
      affiliationId,
    );
    return authCodeId;
  } catch (err) {
    store.handleError(err);
  }
};

type StoredPreAuthCode = {
  usedAt: string;
} & Omit<AuthorizedCode, "isUsed"> &
  Identifiable;
export const getPreAuthCodeAndAffiliation = async (code: string) => {
  try {
    const db = await store.openDb();

    // pre_auth_codesテーブルからcodeに一致するレコードを取得
    const storedAuthCode = await db.get<StoredPreAuthCode>(
      `
      SELECT * FROM ${TBL_NM_AUTH_CODES} WHERE code = ?
    `,
      [code],
    );

    if (!storedAuthCode) {
      return null; // 該当するpre_auth_codeがない場合はnullを返す
    }

    // pre_auth_codes_affiliationからaffiliation_idを取得
    const relation = await db.get(
      `
      SELECT * FROM ${TBL_NM_AUTH_CODES_AFFILIATION} WHERE auth_code_id = ?
    `,
      [storedAuthCode.id],
    );

    if (!relation) {
      throw new Error("PreAuthCode found but no related affiliation found");
    }

    // affiliationテーブルから該当するaffiliationを取得
    const tmp = await db.get<object>(
      `
      SELECT * FROM ${TBL_NM_AFFILIATION} WHERE id = ?
    `,
      [relation.affiliation_id],
    );
    const affiliation = objectToCamel(tmp) as Affiliation // workaround. todo: The use of camel case and snake case should be reviewed comprehensively.
    if (!affiliation) {
      throw new Error("Relation found but no related affiliation found");
    }

    return { storedAuthCode, affiliation: affiliation };
  } catch (err) {
    store.handleError(err); // エラー処理
  }
};

export const addAccessToken = async (
  accessToken: string,
  expiresIn: number,
  cNonce: string,
  cNonceExpiresIn: number,
  authorizedCodeId: number,
) => {
  await authStore.addAccessToken(
    accessToken,
    expiresIn,
    cNonce,
    cNonceExpiresIn,
    authorizedCodeId,
  );
  // preAuthCodeを使用済みに更新
  await authStore.updateAuthCode(authorizedCodeId);
};
export const getAccessToken = async (
  accessToken: string,
): Promise<StoredAccessToken | undefined> => {
  return await authStore.getAccessToken(accessToken);
};
export const refreshNonce = async (
  accessTokenId: number,
  cNonce: string,
  expiresIn: number,
) => {
  return await authStore.refreshNonce(accessTokenId, cNonce, expiresIn);
};

export default {
  createDb,
  destroyDb,
  registerAffiliation,
  getAffiliationByID,
  addPreAuthCode,
  getPreAuthCodeAndAffiliation,
  addAccessToken,
  getAccessToken,
  refreshNonce,
};
