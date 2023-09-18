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
    const sURL = sDMSURL + "browser/" + sRepositoryID + "/root/" + sFileName;
    var sQueryString = "?cmisselector=object&succinct=true&filter=objectId";

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
    formData.append("filename", "sFileName");
    formData.append("succinct", "true");
    formData.append("_charset", "UTF-8");
    formData.append("objectId", sObjectId);
    formData.append("major", "false");
    formData.append("filename", "sFileName");
    formData.append("checkinComment", "update content in the file");
    formData.append("media", buf, sFileName);

    axios
      .post(sURL, formData, config)
      .then((response) => {
        console.log("Success!");
      })
      .catch((error) => {
        reject(error);
      });
  });
};
