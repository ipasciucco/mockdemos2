// const express = require("express");
// const fs = require("fs").promises;
// const url = require('url');
// const path = require("path");
// const formidable = require('formidable');
// const { IncomingForm } = require('formidable');
// const { v4: uuidv4 } = require('uuid');

// const app = express();
// const PORT = 8080;
// const uploadPath = path.join(__dirname, "batch");

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use((req, res, next) => {
//   const [path] = req.originalUrl.split("?");
//   req.url = path;
//   next();
// });

// async function handleProject(project, projectPath, restOfPathGet) {
//   try {
//     const filePath = path.join(__dirname, `./files/${projectPath}.json`);
//     const data = await fs.readFile(filePath, { encoding: "utf-8" });
//     const jsonData = JSON.parse(data);
//     for (const item of jsonData) {
//       var itemURL = new URL(item.request.url);
//       //console.log("itemURL:", itemURL)

//       itemURL.searchParams.delete('sap-language');
//       //console.log("itemURL:", itemURL)

//       const itemUrlJson = itemURL.toString();
//       const itemUrlPartJson = itemUrlJson.split("~");
//       const matchURL = itemUrlPartJson[itemUrlPartJson.length - 1];
//       const normalizedRestOfPath = restOfPathGet.replace(/^\//, "").trim();
//      // console.log("normalizedRestOfPath:", normalizedRestOfPath)
//       const normalizedMatchURL = matchURL.replace(/^\//, "").trim();

//       if (normalizedMatchURL.includes(normalizedRestOfPath)) {
//         const response = item.response.content.text;
//         const contentTypeHeader = item.response.headers.find(
//           (header) => header.name.toLowerCase() === "content-type"
//         );
//         const contentType = contentTypeHeader ? contentTypeHeader.value : "text/plain";
//         return { content: response, contentType };
//       }
//     }
//   } catch (error) {
//     console.log(error);
//     return { path: "Path no encontrado", response: "null" };
//   }
// }
// async function handlePostProject(project, projectPath, restOfPath, fileFull, filesData) {
//   try {
//     const filePath = path.join(__dirname, `./files/${projectPath}.json`);
//     const data = await fs.readFile(filePath, { encoding: "utf-8" });
//     const jsonData = JSON.parse(data);
//     const dataRecibida = fileFull.data;
//     let projectPathSplit = projectPath

//     console.log("projectPathSplit:", projectPathSplit);

//     const solicitudes = filesData.map(obj => obj['solicitud']);
//     console.log("solicitudes:", solicitudes);

//     let response = null;
//     let contieneTodasSolicitudes = false;

//     for (const item of jsonData) {
//       try {
//         const reqPayload = item.request.postData;
//         let reqPayloadText = "";

//         if (reqPayload && reqPayload.text !== undefined && reqPayload.text !== null) {
//           reqPayloadText = reqPayload.text;

//           const dataRecibidaLines = dataRecibida.split("\r\n");
//           const reqPayloadLines = reqPayloadText.split("\r\n");

//           contieneTodasSolicitudes = solicitudes.every(solicitud => reqPayloadLines.includes(solicitud));

//           if (contieneTodasSolicitudes) {
//             let linesCoincidentes = [];

//             for (let i = 0; i < reqPayloadLines.length; i++) {
//               if (reqPayloadLines[i].startsWith('GET') || reqPayloadLines[i].startsWith('POST')) {
//                 for (let j = 0; j < dataRecibidaLines.length; j++) {
//                   if (reqPayloadLines[i].trim() === dataRecibidaLines[j].trim()) {
//                     linesCoincidentes.push(reqPayloadLines[i]);
//                     break;
//                   }
//                 }
//               }
//             }
//             if (linesCoincidentes.length > 0) {
//               linesCoincidentes.forEach((linea) => {
//                 console.log("Linea coincidente:", linea);
//                 try {
//                   const requestHeaders = item.request.headers;
//                   const requestHeaderObject = {};
//                   for (const head of requestHeaders) {
//                     requestHeaderObject[head.name] = head.value;
//                   }
//                   const userAgentHeader = requestHeaders.find(
//                     (header) => header.name.toLowerCase() === "user-agent"
//                   );
//                   if ((userAgentHeader.value.includes("Mobile")) && (projectPathSplit === "inbox")) { // Si es mobile, se devuelve la respuesta de mobile
//                     console.log("userAgentHeader:", userAgentHeader)
//                     const encodedResponse = item.response.content.text;
//                     const decodedResponse = Buffer.from(encodedResponse, 'base64').toString('utf-8');
//                     const headers = item.response.headers;
//                     const headerObject = {};
//                     for (const head of headers) {
//                       headerObject[head.name] = head.value;
//                     }
//                     const contentTypeHeader = item.response.headers.find(
//                       (header) => header.name.toLowerCase() === "content-type"
//                     );
//                     const contentType = contentTypeHeader ? contentTypeHeader.value : "text/plain";
//                     response = { content: decodedResponse, contentType };
//                   } else {
//                     const encodedResponse = item.response.content.text;
//                     const decodedResponse = Buffer.from(encodedResponse, 'base64').toString('utf-8');
//                     const headers = item.response.headers;
//                     const headerObject = {};
//                     for (const head of headers) {
//                       headerObject[head.name] = head.value;
//                     }
//                     const contentTypeHeader = item.response.headers.find(
//                       (header) => header.name.toLowerCase() === "content-type"
//                     );
//                     const contentType = contentTypeHeader ? contentTypeHeader.value : "text/plain";
//                     response = { content: decodedResponse, contentType };
//                   }
//                 } catch (error) {
//                   console.log(error);
//                   response = { path: "Path no encontrado", response: "null" };
//                 }
//               });
//             }
//             break;
//           }
//         }
//       } catch (error) {
//         console.log(error);
//         response = { path: "Error en el procesamiento del pedido", response: "null" };
//       }
//     }

//     return response;
//   } catch (error) {
//     console.log(error);
//     return { path: "Error al leer el archivo", response: "null" };
//   }
// }

// app.get("/favicon.ico", (req, res) => {
//   res.status(204).end();
// });
// app.get("/:project(*)", async (req, res, next) => {
//   const originalURL = url.parse(req.originalUrl); // parse the url
//   console.log("originalURL:", originalURL);
//   const project = originalURL.pathname.slice(1); //obtiene el path
//   const projectPath = project.slice(0, project.indexOf("/")); //obtiene el path hasta el primer /
//   console.log("projectPath:", projectPath);

//   const params = new URLSearchParams(originalURL.search); //obtiene los parametros de la url
//   console.log("params:", params)
//   params.delete('sap-language'); // elimina parametro sap-language
//   console.log("params:", params)
//   const restOfPathGet = originalURL.pathname.substring(originalURL.pathname.indexOf("/", 1)) + (params.toString() ? `?${params.toString()}` : ""); //reconstruye la url sin el parametro sap-language
//   console.log("restOfPathGet:", restOfPathGet);
//   try {
//     const response = await handleProject(project, projectPath, restOfPathGet);
//     if (!response) {
//       res.status(404).json({ path: "Path no encontrado", response: "null" });
//     } else {
//       if (response.contentType) {
//         res.set("Content-Type", response.contentType);
//       }
//       res.status(200).send(response.content);
//     }
//   } catch (error) {
//     res.status(404).json({ path: "Path no encontrado", response: "null" });
//   }
// });

// app.post("/:project(*)", async (req, res, next) => {
//   try {
//     const project = req.params.project;
//     const projectPath = project.slice(0, project.indexOf("/"));
//     const isInbox = projectPath === "inbox";
//     const restOfPathGet = project.slice(project.indexOf(projectPath) + projectPath.length + 1);

//     console.log("projectPath", projectPath);
//     console.log("restOfPathGet:", restOfPathGet);

//     const batchId = uuidv4();
//     const batchFolder = path.join(uploadPath, batchId);
//     await fs.mkdir(batchFolder);

//     const form = new IncomingForm({ uploadDir: batchFolder, multiples: true });

//     let files;

//     form.parse(req, async (err) => {
//       if (err) {
//         console.error("Error al analizar el formulario:", err);
//         res.status(400).json("Error al analizar el formulario");
//         return;
//       }
//       try {
//         files = await fs.readdir(batchFolder);
//         console.log("Lectura de archivos batch iniciada");
//         const filesData = [];

//         const filePromises = files.map(async (file) => {
//           const filePath = path.join(batchFolder, file);
//           const fileStat = await fs.stat(filePath);
//           if (fileStat.isFile()) {
//             const dataBatch = await fs.readFile(filePath, "utf8");
//             let fileFull = {
//               name: file,
//               data: dataBatch,
//               solicitud: dataBatch.split("\r\n")[0],
//             };
//             filesData.push(fileFull);
//           }
//         });
//         await Promise.all(filePromises);
//         console.log("Archivos del pedido leídos:", filesData);

//         let responseSent = false;

//         for (const fileFull of filesData) {
//           try {
//             const response = await handlePostProject(project, projectPath, restOfPathGet, fileFull, filesData);
//             if (response) {
//               res.set("Content-Type", response.contentType);
//               res.status(200).send(response.content);
//               responseSent = true;
//               break;
//             }
//           } catch (error) {
//             console.error("Error al procesar el pedido:", error);
//           }
//         }

//         if (!responseSent) {
//           res.status(404).json("Error al analizar el formulario");
//         }
//       } catch (error) {
//         console.error("Error al leer los archivos:", error);
//         res.status(500).json("Error al leer los archivos");
//       } finally {
//         if (files) {
//           // Eliminar archivos del directorio del pedido
//           const deletePromises = files.map(async (file) => {
//             const filePath = path.join(batchFolder, file);
//             await fs.unlink(filePath);
//           });
//           await Promise.all(deletePromises);
//         }

//         await fs.rm(batchFolder, { recursive: true });
//       }
//     });
//   } catch (error) {
//     console.error("Error en la función principal:", error);
//     res.status(500).json("Error en el servidor");
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Servidor en ejecución en el puerto ${PORT}`);
// })

const express = require("express");
const fs = require("fs").promises;
const url = require("url");
const path = require("path");
const formidable = require("formidable");
const { IncomingForm } = require("formidable");
const { v4: uuidv4 } = require("uuid");
const { match } = require("assert");

const app = express();
const PORT = 8080;
const uploadPath = path.join(__dirname, "batch");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const [path] = req.originalUrl.split("?");
  req.url = path;
  next();
});

// DOCUMENT MANAGEMENT SERVICE FUNCTIONALITY
const xsenv = require("@sap/xsenv");
const axios = require("axios");
const FormData = require("form-data");
xsenv.loadEnv();
const uaa_service = xsenv.getServices({ uaa: { tag: "xsuaa" } }).uaa;
const dest_service = xsenv.getServices({ sdm: { tag: 'sdm' } }).credentials

const sUaaCredentials =
  dest_service.uaa.clientid + ":" + dest_service.uaa.clientsecret;
const sOAuthURL = uaa_service.url;
const sDMSURL = "https://api-sdm-di.cfapps.us10.hana.ondemand.com/";
var services = xsenv.readServices();
console.log(services.serviceInstance);
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

// only reads json files
const _ReadFile = async function (jwtToken, sRepositoryID, sFilename) {
  return new Promise((resolve, reject) => {
    if (sRepositoryID) {
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
        // only reads json files
        responseType: "json",
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

async function handleProject(project, projectPath, restOfPathGet) {
  try {
    const sRepositoryID = "57ef70a1-073e-4443-a1cf-a33872276f5e";
    const sFileName = projectPath + ".json";
    const tokenDMS = await _fetchJwtToken();
    const responseJSONFile = await _ReadFile(
      tokenDMS,
      sRepositoryID,
      sFileName
    );
    const jsonData = responseJSONFile.data;
    for (const item of jsonData) {
      var itemURL = new URL(item.request.url);
      // console.log("itemURL:", itemURL)

      itemURL.searchParams.delete("sap-language");
      itemURL.searchParams.delete("ts");

      //console.log("itemURL:", itemURL)

      const itemUrlJson = itemURL.toString();
      const itemUrlPartJson = itemUrlJson.split("~");
      const matchURL = itemUrlPartJson[itemUrlPartJson.length - 1];
      console.log(matchURL);
      const normalizedRestOfPath = restOfPathGet.replace(/^\//, "").trim();
      // console.log("normalizedRestOfPath:", normalizedRestOfPath)
      const normalizedMatchURL = matchURL.replace(/^\//, "").trim();

      if (normalizedMatchURL.includes(normalizedRestOfPath)) {
        const response = item.response.content.text;
        const contentTypeHeader = item.response.headers.find(
          (header) => header.name.toLowerCase() === "content-type"
        );
        const contentType = contentTypeHeader
          ? contentTypeHeader.value
          : "text/plain";
        return { content: response, contentType };
      }
    }
  } catch (error) {
    console.log(error);
    return { path: "Path no encontrado", response: "null" };
  }
}
async function handlePostProject(
  project,
  projectPath,
  restOfPath,
  fileFull,
  filesData
) {
  try {
    // const filePath = path.join(__dirname, `./files/${projectPath}.json`);
    // const data = await fs.readFile(filePath, { encoding: "utf-8" });
    // const jsonData = JSON.parse(data);
    const sRepositoryID = "57ef70a1-073e-4443-a1cf-a33872276f5e";
    const sFileName = projectPath + ".json";
    const tokenDMS = await _fetchJwtToken();
    const responseJSONFile = await _ReadFile(
      tokenDMS,
      sRepositoryID,
      sFileName
    );
    const jsonData = responseJSONFile.data;

    const dataRecibida = fileFull.data;
    let projectPathSplit = projectPath;

    console.log("projectPathSplit:", projectPathSplit);

    const solicitudes = filesData.map((obj) => obj["solicitud"]);
    console.log("solicitudes:", solicitudes);

    let response = null;
    let contieneTodasSolicitudes = false;

    for (const item of jsonData) {
      try {
        const reqPayload = item.request.postData;
        let reqPayloadText = "";

        if (
          reqPayload &&
          reqPayload.text !== undefined &&
          reqPayload.text !== null
        ) {
          reqPayloadText = reqPayload.text;

          const dataRecibidaLines = dataRecibida.split("\r\n");
          const reqPayloadLines = reqPayloadText.split("\r\n");

          contieneTodasSolicitudes = solicitudes.every((solicitud) =>
            reqPayloadLines.includes(solicitud)
          );

          if (contieneTodasSolicitudes) {
            let linesCoincidentes = [];

            for (let i = 0; i < reqPayloadLines.length; i++) {
              if (
                reqPayloadLines[i].startsWith("GET") ||
                reqPayloadLines[i].startsWith("POST")
              ) {
                for (let j = 0; j < dataRecibidaLines.length; j++) {
                  if (
                    reqPayloadLines[i].trim() === dataRecibidaLines[j].trim()
                  ) {
                    linesCoincidentes.push(reqPayloadLines[i]);
                    break;
                  }
                }
              }
            }
            if (linesCoincidentes.length > 0) {
              linesCoincidentes.forEach((linea) => {
                console.log("Linea coincidente:", linea);
                try {
                  const requestHeaders = item.request.headers;
                  const requestHeaderObject = {};
                  for (const head of requestHeaders) {
                    requestHeaderObject[head.name] = head.value;
                  }
                  const userAgentHeader = requestHeaders.find(
                    (header) => header.name.toLowerCase() === "user-agent"
                  );
                  if (
                    userAgentHeader.value.includes("Mobile") &&
                    projectPathSplit === "inbox"
                  ) {
                    // Si es mobile, se devuelve la respuesta de mobile
                    console.log("userAgentHeader:", userAgentHeader);
                    const encodedResponse = item.response.content.text;
                    const decodedResponse = Buffer.from(
                      encodedResponse,
                      "base64"
                    ).toString("utf-8");
                    const headers = item.response.headers;
                    const headerObject = {};
                    for (const head of headers) {
                      headerObject[head.name] = head.value;
                    }
                    const contentTypeHeader = item.response.headers.find(
                      (header) => header.name.toLowerCase() === "content-type"
                    );
                    const contentType = contentTypeHeader
                      ? contentTypeHeader.value
                      : "text/plain";
                    response = { content: decodedResponse, contentType };
                  } else {
                    const encodedResponse = item.response.content.text;
                    const decodedResponse = Buffer.from(
                      encodedResponse,
                      "base64"
                    ).toString("utf-8");
                    const headers = item.response.headers;
                    const headerObject = {};
                    for (const head of headers) {
                      headerObject[head.name] = head.value;
                    }
                    const contentTypeHeader = item.response.headers.find(
                      (header) => header.name.toLowerCase() === "content-type"
                    );
                    const contentType = contentTypeHeader
                      ? contentTypeHeader.value
                      : "text/plain";
                    response = { content: decodedResponse, contentType };
                  }
                } catch (error) {
                  console.log(error);
                  response = { path: "Path no encontrado", response: "null" };
                }
              });
            }
            break;
          }
        }
      } catch (error) {
        console.log(error);
        response = {
          path: "Error en el procesamiento del pedido",
          response: "null",
        };
      }
    }

    return response;
  } catch (error) {
    console.log(error);
    return { path: "Error al leer el archivo", response: "null" };
  }
}

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});
app.get("/:project(*)", async (req, res, next) => {
  const originalURL = url.parse(req.originalUrl); // parse the url
  console.log("originalURL:", originalURL);
  const project = originalURL.pathname.slice(1); //obtiene el path
  const projectPath = project.slice(0, project.indexOf("/")); //obtiene el path hasta el primer /
  console.log("projectPath:", projectPath);

  const params = new URLSearchParams(originalURL.search); //obtiene los parametros de la url
  console.log("params:", params);
  params.delete("sap-language"); // elimina parametro sap-language
  params.delete("ts");
  console.log("params:", params);
  const restOfPathGet =
    originalURL.pathname.substring(originalURL.pathname.indexOf("/", 1)) +
    (params.toString() ? `?${params.toString()}` : ""); //reconstruye la url sin el parametro sap-language
  console.log("restOfPathGet:", restOfPathGet);
  try {
    const response = await handleProject(project, projectPath, restOfPathGet);
    if (!response) {
      res.status(404).json({ path: "Path no encontrado", response: "null" });
    } else {
      if (response.contentType) {
        res.set("Content-Type", response.contentType);
      }
      res.status(200).send(response.content);
    }
  } catch (error) {
    res.status(404).json({ path: "Path no encontrado", response: "null" });
  }
});

app.post("/:project(*)", async (req, res, next) => {
  try {
    const project = req.params.project;
    const projectPath = project.slice(0, project.indexOf("/"));
    const isInbox = projectPath === "inbox";
    const restOfPathGet = project.slice(
      project.indexOf(projectPath) + projectPath.length + 1
    );

    console.log("projectPath", projectPath);
    console.log("restOfPathGet:", restOfPathGet);

    const batchId = uuidv4();
    const batchFolder = path.join(uploadPath, batchId);
    await fs.mkdir(batchFolder);

    const form = new IncomingForm({ uploadDir: batchFolder, multiples: true });

    let files;

    form.parse(req, async (err) => {
      if (err) {
        console.error("Error al analizar el formulario:", err);
        res.status(400).json("Error al analizar el formulario");
        return;
      }
      try {
        files = await fs.readdir(batchFolder);
        console.log("Lectura de archivos batch iniciada");
        const filesData = [];

        const filePromises = files.map(async (file) => {
          const filePath = path.join(batchFolder, file);
          const fileStat = await fs.stat(filePath);
          if (fileStat.isFile()) {
            const dataBatch = await fs.readFile(filePath, "utf8");
            let fileFull = {
              name: file,
              data: dataBatch,
              solicitud: dataBatch.split("\r\n")[0],
            };
            filesData.push(fileFull);
          }
        });
        await Promise.all(filePromises);
        console.log("Archivos del pedido leídos:", filesData);

        let responseSent = false;

        for (const fileFull of filesData) {
          try {
            const response = await handlePostProject(
              project,
              projectPath,
              restOfPathGet,
              fileFull,
              filesData
            );
            if (response) {
              res.set("Content-Type", response.contentType);
              res.status(200).send(response.content);
              responseSent = true;
              break;
            }
          } catch (error) {
            console.error("Error al procesar el pedido:", error);
          }
        }

        if (!responseSent) {
          res.status(404).json("Error al analizar el formulario");
        }
      } catch (error) {
        console.error("Error al leer los archivos:", error);
        res.status(500).json("Error al leer los archivos");
      } finally {
        if (files) {
          // Eliminar archivos del directorio del pedido
          const deletePromises = files.map(async (file) => {
            const filePath = path.join(batchFolder, file);
            await fs.unlink(filePath);
          });
          await Promise.all(deletePromises);
        }

        await fs.rm(batchFolder, { recursive: true });
      }
    });
  } catch (error) {
    console.error("Error en la función principal:", error);
    res.status(500).json("Error en el servidor");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});
