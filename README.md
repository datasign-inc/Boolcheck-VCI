# Boolcheck-VCI

## セットアップ
Node.js バージョン18 以上がインストールされていることを確認してください。必要に応じて、nvm（Node Version Manager）を使用して適切な Node.js のバージョンをインストールし、使用できます。

```shell
nvm install stable --latest-npm
nvm use 18
```

本リポジトリが依存する[ownd-vci](https://github.com/OWND-Project/OWND-Project-VCI)はnpmjsで公開されていないので、手動でアプリ開発者の環境にクローンする必要があります。
手動で `yarn build` を実行し、`yarn link` して npm パッケージとして登録してください。

```shell
git clone git@github.com:OWND-Project/OWND-Project-VCI.git
cd OWND-Project-VCI
git checkout develop # As needed.
yarn
yarn build
yarn link
```

その後、このリポジトリのルート・ディレクトリに戻り`yarn link ownd-vci` を実行してしてください。

### リンク
```shell
yarn link ownd-vci
```

### インストール
```shell
yarn
```

### 環境変数のセット
.env.template を元に .env ファイルを作成してください。

```shell
cp .env.template .env
```

| Key                                 | Sample Value                 | 
| ----------------------------------- |------------------------------| 
| ENVIRONMENT                         | dev                          | 
| DATABASE_FILEPATH                   | ./database.sqlite            | 
| APP_PORT                            | 3000                         | 
| BASIC_AUTH_USERNAME                 | username                     | 
| BASIC_AUTH_PASSWORD                 | password                     | 
| CREDENTIAL_ISSUER_IDENTIFIER        | https://demo-vci.exemple.com | 
| CREDENTIAL_ISSUER                   | https://demo-vci.exemple.com | 
| CREDENTIAL_OFFER_ENDPOINT           | openid-credential-offer://   | 
| VCI_PRE_AUTH_CODE_EXPIRES_IN        | 86400                        | 
| VCI_ACCESS_TOKEN_EXPIRES_IN         | 86400                        | 
| VCI_ACCESS_TOKEN_C_NONCE_EXPIRES_IN | 86400                        | 

```
BASIC_AUTH_USERNAME=username
BASIC_AUTH_PASSWORD=password
```

など 適宜内容を調整してください。

### 実行
```shell
yarn start
```

## サーバー証明書の登録
事前準備としてVC発行者のサーバー証明書の生成、登録が必要です。

詳細な手順は[こちら](https://github.com/OWND-Project/OWND-Project-VCI/blob/main/src/README_JP.md#admin-endpoints-1)を参考に実施してください。

(自己署名証明書でもVCの発行までは可能ですが、Verifierへの提供時にはエラーになるのでご注意ください)

## 所属組織VCの発行
### 所属組織VCのメタデータ登録

APIで新たな組織メンバーを登録します。

#### Authorization

Basic認証を用います。ユーザー名とパスワードを`username:password`形式でBase64でエンコードした値を`Authorization`ヘッダーにセットしてください。

#### Headers

- `Content-Type: application/json`

#### Request Payload

| パラメータ                        | 型       | 説明                               |
|----------------------------------|--------|----------------------------------|
| organizationUnitName             | string | 組織の部署名                      |
| familyName                      | string | 姓（Last Name）                  |
| givenName                       | string | 名（First Name）                 |
| portrait                         | string | 肖像画像（プロフィール画像）         |
| title                           | string | 役職                             |
| organizationName                 | string | 組織名                            |
| organizationCountry              | string | 組織の所在国                      |
| organizationStateProvince        | string | 組織の所在都道府県                 |
| organizationLocality             | string | 組織の所在市区町村                 |
| organizationBusinessCategory     | string | 組織の業種                        |
| organizationSerialNumber         | string | 組織の法人番号                    |
| organizationUrl                  | string | 組織のウェブサイトURL              |
| authenticationType               | string | 認証の種類（法人所属認証など）        |
| snsX                             | string | X（旧Twitter）のSNSアカウント      |
| snsFacebook                      | string | FacebookのSNSアカウント           |
| snsBluesky                       | string | BlueskyのSNSアカウント           |
| snsHatena                       | string | はてな（Hatena）のSNSアカウント      |
| snsInstagram                    | string | InstagramのSNSアカウント          |
| snsYoutube                      | string | YouTubeのSNSアカウント            |

#### Example Request

```bash
curl -X POST \
http://localhost:3000/admin/affiliation/new \
-H 'Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=' \
-H 'Content-Type: application/json' \
-d '{
  "affiliation": {
    "snsHatena": "N/A",
    "snsInstagram": "N/A",
    "snsYoutube": "N/A",
    "organizationUnitName": "N/A",
    "givenName": "太郎",
    "familyName": "山田",
    "title": "部長",
    "organizationName": "株式会社DataSign",
    "organizationCountry": "日本",
    "organizationStateProvince": "東京都",
    "organizationLocality": "新宿区",
    "organizationBusinessCategory": "Private Organization",
    "organizationSerialNumber": "5011001112794",
    "organizationUrl": "https://datasign.jp/",
    "authenticationType": "法人所属認証",
    "snsX": "N/A",
    "snsFacebook": "N/A",
    "snsBluesky": "N/A",
    "portrait": "N/A"
  }
}'
```

### 所属組織VCの発行

APIで新たな社員証VCクレデンシャルオファーを生成します。

#### Authorization

Basic認証を用います。ユーザー名とパスワードを`username:password`形式でBase64でエンコードした値を`Authorization`ヘッダーにセットしてください。

#### Headers

- `Content-Type: application/json`

#### Request Payload

| パラメータ | 型      | 説明   |
|------------|--------|------|
| affiliationNo  | number | 所属番号 |

#### Example Request

##### Curl

```bash
curl -X POST \
http://localhost:3000/admin/affiliation/1/credential-offer \
-H 'Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=' \
-H 'Content-Type: application/json' 
```
レスポンス例
```json
{
  "subject":{
    "affiliationID":"1"
  },
  "credentialOffer":"openid-credential-offer://?credential_offer=%7B%22credential_issuer%22%3A%22%22%2C%22credentials%22%3A%5B%22OrganizationalAffiliationCertificate%22%5D%2C%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22iOs98ZmXzvMfdBeOUUysLDULb4IsNZld%22%2C%22user_pin_required%22%3A%7B%7D%7D%7D%7D",
  "txCode":"34607613"
}
```
