const express = require("express");
const rp = require("request-promise");
const xsenv = require("@sap/xsenv");
const axios = require("axios");
const FormData = require("form-data");

xsenv.loadEnv();

const app = express();
const port = process.env.PORT || 3000;
const dest_service = xsenv.getServices({ dest: { tag: "destination" } }).dest;
const uaa_service = xsenv.getServices({ uaa: { tag: "xsuaa" } }).uaa;
const sUaaCredentials =
  dest_service.uaa.clientid + ":" + dest_service.uaa.clientsecret;

const sOAuthURL = uaa_service.url;
const sDMSURL = "https://api-sdm-di.cfapps.us10.hana.ondemand.com/";

const _fetchJwtToken = async function () {
  // This is to get the oauth token , which is used to create the folder ID
  return new Promise((resolve, reject) => {
    const tokenUrl =
      sOAuthURL +
      "/oauth/token?grant_type=client_credentials&response_type=token";
    const config = {
      headers: {
        Authorization:
          "Basic " + Buffer.from(sUaaCredentials).toString("base64"),
      },
    };
    axios
      .get(tokenUrl, config)
      .then((response) => {
        resolve(response.data.access_token);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const _ReadRepositories = async function (jwtToken) {
  return new Promise((resolve, reject) => {
    const sURL = sDMSURL + "rest/v2/repositories";

    const formData = new FormData();
    let headers = formData.getHeaders();
    headers["Authorization"] = "Bearer " + jwtToken;

    const config = {
      headers: headers,
    };

    axios
      .get(sURL, config)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const _ReadFile = async function (jwtToken, sRepositoryID, sFilename) {
  return new Promise((resolve, reject) => {
    if (sRepositoryID) {
      // var sQueryString = '?cmisselector=content&download=attachment&objectId=' + oBody.IDArchivo  ;
      // var sQueryString = '?cmisselector=object';
      var sQueryString = "";

      var sURL = sDMSURL + "browser/" + sRepositoryID + "/root/" + sFilename;
      if (sQueryString) {
        sURL += sQueryString;
      }
      const formData = new FormData();
      let headers = formData.getHeaders();
      headers["Authorization"] = "Bearer " + jwtToken;

      const config = {
        headers: headers,
        responseType: "arraybuffer",
        responseEncoding: "binary",
      };
      axios
        .get(sURL, config)
        .then((response, oData) => {
          response.IDRepositorio = sRepositoryID;
          // console.log(JSON.parse(response.data.toString()));
          // console.log(Buffer.from(response.data).toJSON())
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    } else {
      var oError = {
        response: {
          data: {
            message: "El filtro IDRepositorio es obligatorio ",
          },
        },
      };
      reject(oError);
    }
  });
};

const _CheckOutFile = async function (jwtToken, sRepositoryID, sObjectId) {
  return new Promise((resolve, reject) => {
    const sURL = sDMSURL + "browser/" + sRepositoryID + "/root";

    const formData = new FormData();
    let headers = formData.getHeaders();
    headers["Authorization"] = "Bearer " + jwtToken;

    formData.append("cmisaction", "checkOut");
    formData.append("objectId", sObjectId);
    formData.append("succinct", "true");
    formData.append("includeAllowableActions", "true");

    const config = {
      headers: headers,
    };

    axios
      .post(sURL, formData, config)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const _GetIdFileByName = async function (jwtToken, sRepositoryID, sFileName) {
  return new Promise((resolve, reject) => {
    var sURL = sDMSURL + "browser/" + sRepositoryID + "/root/" + sFileName;
    var sQueryString = "?cmisselector=object&succinct=true&filter=objectId";
    sURL = sURL + sQueryString;

    const formData = new FormData();
    let headers = formData.getHeaders();
    headers["Authorization"] = "Bearer " + jwtToken;

    const config = {
      headers: headers,
    };

    axios
      .get(sURL, config)
      .then((response) => {
        resolve(response.data.succinctProperties["cmis:objectId"]);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

// El objectId es el que obtenes cuando realizas el checkOut
const _CheckInFile = async function (
  jwtToken,
  sRepositoryID,
  sObjectId,
  sFileName
) {
  return new Promise((resolve, reject) => {
    const sURL = sDMSURL + "browser/" + sRepositoryID + "/root";

    const formData = new FormData();
    let headers = formData.getHeaders();
    headers["Authorization"] = "Bearer " + jwtToken;

    const buf = new Buffer(
      "ewogICAgIm5hbWUiOiJKb2huIiwgCiAgICAiYWdlIjozMCwgCiAgICAiY2FyIjpudWxsCn0K",
      "base64"
    );

    const config = {
      headers: headers,
    };

    formData.append("cmisaction", "checkIn");
    formData.append("filename", sFileName);
    formData.append("succinct", "true");
    formData.append("_charset", "UTF-8");
    formData.append("objectId", sObjectId);
    formData.append("major", "false");
    formData.append("checkinComment", "update content in the file");
    formData.append("media", buf, sFileName);

    axios
      .post(sURL, formData, config)
      .then((response) => {
        resolve(response)
      })
      .catch((error) => {
        reject(error);
      });
  });
};

// const token = _fetchJwtToken();
// token.then((token) => {
//   _GetIdFileByName(
//     token,
//     "57ef70a1-073e-4443-a1cf-a33872276f5e",
//     "inbox.json"
//   ).then((response) => {
//     const sObjId = response;
//     _CheckOutFile(token, "57ef70a1-073e-4443-a1cf-a33872276f5e", sObjId).then(
//       (response) => {
//         const sCheckOutObjectId = response.succinctProperties["cmis:objectId"];
//         _CheckInFile(
//           token,
//           "57ef70a1-073e-4443-a1cf-a33872276f5e",
//           sCheckOutObjectId,
//           "inbox.json"
//         ).then((response) => {
//           console.log("exitos!");
//         });
//       }
//     );
//   });
// });

const sRepositoryID = "57ef70a1-073e-4443-a1cf-a33872276f5e";
    const sFileName = 'inbox' + ".json";
    const tokenDMS = _fetchJwtToken();
    tokenDMS.then((response) => {
      // console.log(response)
      _ReadFile(response, sRepositoryID, sFileName).then((response) => {
        console.log('alberto romulado');
      });
    });

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
