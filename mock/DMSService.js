const cds = require('@sap/cds')
const axios = require('axios');
const FormData = require('form-data');
const xsenv = require('@sap/xsenv');
const toStream = require('buffer-to-stream');

xsenv.loadEnv();

const uaa_service = xsenv.getServices({ uaa: { tag: 'xsuaa' } }).uaa;
const sUaaCredentials = uaa_service.clientid + ':' + uaa_service.clientsecret;
const sOAuthURL = uaa_service.url;
const sDMSURL = "https://api-sdm-di.cfapps.us10.hana.ondemand.com/";



const _fetchJwtToken = async function () {
    // This is to get the oauth token , which is used to create the folder ID
    return new Promise((resolve, reject) => {
        const tokenUrl = sOAuthURL + '/oauth/token?grant_type=client_credentials&response_type=token'
        const config = {
            headers: {
                Authorization: "Basic " + Buffer.from(sUaaCredentials).toString("base64")
            }
        }
        axios.get(tokenUrl, config)
            .then(response => {
                resolve(response.data.access_token)
            })
            .catch(error => {
                reject(error)
            })
    })
}

const _ReadRepositories = async function(jwtToken){

    return new Promise((resolve, reject) => {
        const sURL = sDMSURL + "rest/v2/repositories"

        const formData = new FormData();
        let headers = formData.getHeaders();
        headers["Authorization"] = "Bearer " + jwtToken;
        
        const config = {
            headers: headers
        }

        axios.get(sURL, config)
            .then(response => {
                resolve(response.data)
            })
            .catch(error => {
                reject(error)
            })
    })
}


const _CreateRepository = async function(jwtToken,oBody){

    return new Promise((resolve, reject) => {
        const sURL = sDMSURL + "rest/v2/repositories"

        const formData = new FormData();
        let headers = formData.getHeaders();
        headers["Authorization"] = "Bearer " + jwtToken;
        headers["Content-Type"] = 'application/json';

        var oRequest  = {
            "repository": {
                  "displayName": oBody.Nombre,
                  "description": oBody.Descripcion,
                  "repositoryType": oBody.TipoRepositorio,
                  "isVersionEnabled":"true",
                  "isVirusScanEnabled":"false",
                  "skipVirusScanForLargeFile": "true",
                  "hashAlgorithms":"None"
            }
          };
        
        const config = {
            headers: headers
        }

        axios.post(sURL, oRequest, config)
            .then(response => {
                resolve(response.data)
            })
            .catch(error => {
                reject(error)
            })
    })
}

const _DeleteRepository = async function(jwtToken,sID){

    return new Promise((resolve, reject) => {
        const sURL = sDMSURL + "rest/v2/repositories" +"/" + sID

        const formData = new FormData();
        let headers = formData.getHeaders();
        headers["Authorization"] = "Bearer " + jwtToken;

    
    
        
        const config = {
            headers: headers
        }

        axios.delete(sURL, config)
            .then(response => {
                resolve(response.data)
            })
            .catch(error => {
                reject(error)
            })
    })
}



const _CreateFolder = async function(jwtToken,oBody){

    return new Promise((resolve, reject) => {
        const sURL = sDMSURL + "browser/" + oBody.IDRepositorio + "/root";
        const formData = new FormData();
        let headers = formData.getHeaders();
        headers["Authorization"] = "Bearer " + jwtToken;
        headers["Content-Type"] = 'application/x-www-form-urlencoded';
      // headers["Content-Type"] = 'application/json';

        formData.append('cmisaction', 'createFolder');
        formData.append('propertyId[0]', 'cmis:name');
        formData.append('propertyValue[0]', oBody.NombreCarpeta);
        if(oBody.IDCarpetaPadre){
        formData.append('objectId', oBody.IDCarpetaPadre);
        }
        formData.append('propertyId[1]', 'cmis:objectTypeId');
        formData.append('propertyValue[1]', 'cmis:folder');
        
        const config = {
            headers: headers
        }

        axios.post(sURL, formData, config)
            .then(response => {
                resolve(response.data)
            })
            .catch(error => {
                reject(error)
            })
    })
}

const _parseFilters = function(aWhere){
    var iCounter = 0,
        sField = "",
        sSign = "",
        sValue = "",
        aFilterParsed = [];
        
if(!aWhere){
    return [];
}

   aWhere.forEach(oElement => {

    if( oElement != "and" && oElement != 'or'){
    iCounter += 1;
       if (iCounter == 1 ){
        sField = oElement.ref[0];
       }
       if ( iCounter == 2 ) {
        sSign =  oElement;
       }

       if ( iCounter == 3 ) {
        sValue =  oElement.val;
        iCounter = 0;
        aFilterParsed.push({ field:sField,
                             sign: sSign,
                             value: sValue });

       }

    }

    });
return aFilterParsed;


}

const _ReadFolder = async function(jwtToken,aFilters,sRepositoryID){

    return new Promise((resolve, reject) => {            
        if (sRepositoryID){
        if ( aFilters.find((oElement) =>  oElement.field == 'IDCarpetaPadre' ) ){
         var sQueryString = `?objectId=${aFilters.find((oElement) =>  oElement.field == 'IDCarpetaPadre').value}`;

        }
        var sURL = sDMSURL + "browser/" + sRepositoryID + "/root";
        if(sQueryString){
            sURL +=  sQueryString;
        }
        const formData = new FormData();
        let headers = formData.getHeaders();
        headers["Authorization"] = "Bearer " + jwtToken;

     
        const config = {
            headers: headers
        }

        axios.get(sURL, config)
            .then(response => {
                response.IDRepositorio = sRepositoryID;
                resolve(response.data)
            })
            .catch(error => {
                reject(error)
            })

        }else {
         var oError = {
            response : { 
                data: {
                    message: "El filtro IDRepositorio es obligatorio "
                }
            }



         }
            reject(oError);

        }
    })
}

const _DeleteFolder = function async (jwtToken,oBody){

    return new Promise((resolve, reject) => {
        const sURL = sDMSURL + "browser/" + oBody.IDRepositorio + "/root";
        const formData = new FormData();
        let headers = formData.getHeaders();
        headers["Authorization"] = "Bearer " + jwtToken;
        headers["Content-Type"] = 'application/x-www-form-urlencoded';
      // headers["Content-Type"] = 'application/json';

        formData.append('cmisaction', 'deleteTree');
        formData.append('objectId', oBody.IDCarpeta);
        formData.append('allVersions', "true");
        formData.append('unfileObjects', '');
        formData.append('continueOnFailure', 'true');
        
        const config = {
            headers: headers
        }

        axios.post(sURL, formData, config)
            .then(response => {
                resolve(response.data)
            })
            .catch(error => {
                reject(error)
            })
    })


    
}

const _ApplyFilters = function (aFilters,aData){
    var aDataFiltered = aData;

    aFilters.forEach( oElement => {
     
        aDataFiltered = aDataFiltered.filter( oData => {
        return    oData[oElement.field] == oElement.value;

        } );


    });
return aDataFiltered;
}

const _CreateArchivos = async function(jwtToken,oBody){

    return new Promise((resolve, reject) => {
    if (!oBody.Content){
        var b64string = oBody.ContentBase64;
        var buf = new Buffer(b64string, 'base64')
    }else{
        buf = oBody.Content;
    }
        const sURL = sDMSURL + "browser/" + oBody.IDRepositorio + "/root";
        const formData = new FormData();
        let headers = formData.getHeaders();
        headers["Authorization"] = "Bearer " + jwtToken;
        headers["Content-Type"] = 'application/x-www-form-urlencoded';
      // headers["Content-Type"] = 'application/json';

        formData.append('cmisaction', 'createDocument');
        formData.append('propertyId[0]', 'cmis:name');
        formData.append('propertyValue[0]', oBody.fileName);

        if(oBody.IDCarpeta){
        formData.append('objectId', oBody.IDCarpeta);
        }
        formData.append('propertyId[1]', 'cmis:objectTypeId');
        formData.append('propertyValue[1]', 'cmis:document');     
        formData.append('filename', oBody.fileName);
        formData.append('_charset', "UTF-8");
        formData.append('includeAllowableActions', "false");
        formData.append('succinct', "false");
        formData.append('media', buf ,oBody.fileName, );

        
        const config = {
            headers: headers
        }

        axios.post(sURL, formData, config)
            .then(response => {
                resolve(response.data)
            })
            .catch(error => {
                reject(error)
            })
    })





}


const _ReadFile = async function(jwtToken,oBody,sRepositoryID){

    return new Promise((resolve, reject) => {            
        if (sRepositoryID){
     
         var sQueryString = '?cmisselector=content&download=attachment&objectId=' + oBody.IDArchivo  ;

   
        var sURL = sDMSURL + "browser/" + sRepositoryID + "/root";
        if(sQueryString){
            sURL +=  sQueryString;
        }
        const formData = new FormData();
        let headers = formData.getHeaders();
        headers["Authorization"] = "Bearer " + jwtToken;

     
        const config = {
            headers: headers,
            responseType:"arraybuffer",
            responseEncoding: "binary"
        }

     

        axios.get(sURL, config)
            .then(( response,oData ) => {
                response.IDRepositorio = sRepositoryID;
                resolve(response)
            })
            .catch(error => {
                reject(error)
            })

        }else {
         var oError = {
            response : { 
                data: {
                    message: "El filtro IDRepositorio es obligatorio "
                }
            }



         }
            reject(oError);

        }
    })

}

const _deleteFile = async function(jwtToken,sFileID,sRepositoryID){
    return new Promise((resolve, reject) => {   
        var sURL = sDMSURL + "browser/" + sRepositoryID + "/root";
        const formData = new FormData();
        let headers = formData.getHeaders();
        headers["Authorization"] = "Bearer " + jwtToken;
        formData.append('cmisaction', 'delete');
        formData.append('objectId', sFileID);

        const config = {
            headers: headers
        }

        axios.post(sURL, formData, config)
        .then(response => {
            resolve(response.data)
        })
        .catch(error => {
            reject(error)
        })



    })

}

module.exports = (srv)=>{

    srv.on ('CREATE','Repositorios', async (req) => {
        var oRequestData =  req.data;
        var jwtToken =  await _fetchJwtToken();
        try {
        var oData = await _CreateRepository(jwtToken,oRequestData);
        oRequestData.ID = oData.id;
        return oRequestData;
        } catch(e){
            req.reject(400, e.response.data.message, []);

        }


    });

    srv.on ('READ','Repositorios',async req => {
    var jwtToken =  await _fetchJwtToken();
    var aData = await _ReadRepositories(jwtToken);
    console.log(aData);
    if( aData.repoAndConnectionInfos.length ){

   var aResponse =  aData.repoAndConnectionInfos.map( (oElement) => {
    return{
    ID :oElement.repository.id ,
        Nombre: oElement.repository.name ,
        Descripcion: oElement.repository.description ,
        TipoRepositorio: oElement.repository.repositoryType 
    }
   })

     return  aResponse;
} else{
    return  [ {ID : aData.repoAndConnectionInfos.repository.id ,
        Nombre: aData.repoAndConnectionInfos.repository.name ,
        Descripcion: aData.repoAndConnectionInfos.repository.description ,
        TipoRepositorio: aData.repoAndConnectionInfos.repository.repositoryType }]
   

}
    



    });


    srv.on ('DELETE','Repositorios',async req => {
        var jwtToken =  await _fetchJwtToken();
        try {
        var oResp = await _DeleteRepository(jwtToken,req.data.ID);
        } catch(e){
            req.reject(400, e.response.data.message, []);

        }
        
  


    });


    srv.on ('CREATE','Carpetas', async req => {

        var jwtToken =  await _fetchJwtToken();

        try {
            var oResp = await  _CreateFolder(jwtToken,req.data);
            var oRespBody = {
                IDRepositorio : req.data.IDRepositorio,
                IDCarpeta:  oResp.properties['cmis:objectId'].value,
                NombreCarpeta: req.data.NombreCarpeta,
                IDCarpetaPadre:  req.data.IDCarpetaPadre
            }
            return oRespBody;
            } catch(e){
                req.reject(400, e.response.data.message, []);
    
            }
     
    });

    srv.on ('READ','Carpetas', async req => {
        var jwtToken =  await _fetchJwtToken();
        var aFilters =    _parseFilters(req.query.SELECT.where);      
        var sRepositoryID =  aFilters.find((oElement) =>  oElement.field == 'IDRepositorio' )  ? aFilters.find((oElement) =>  oElement.field == 'IDRepositorio' ).value : "";
        if(!sRepositoryID){
            req.reject(400, "El filtro IDRepositorio es obligatorio ", []);  
        }
        try {
        var oResp = await _ReadFolder(jwtToken,aFilters,sRepositoryID);  
      var aResponse = oResp.objects.map((oElement) => {
        return {
            IDCarpeta : oElement.object.properties['cmis:objectId'].value , 
            NombreCarpeta : oElement.object.properties['cmis:name'].value ,
            IDCarpetaPadre :  oElement.object.properties['sap:parentIds'].value[0] ,
            IDRepositorio : sRepositoryID



        };
      

        });
        aResponse = _ApplyFilters(aFilters,aResponse);
        return aResponse;


    } catch(e){
        req.reject(400, e.response.data.message, []);

    }


    });
    


    srv.on ('DELETE','Carpetas', async req => {

        var oRequestData =  req.data;
        var jwtToken =  await _fetchJwtToken();
        try {
        var oData = await _DeleteFolder(jwtToken,oRequestData);
        oRequestData.ID = oData.id;
        return oRequestData;
        } catch(e){
            req.reject(400, e.response.data.message, []);
    
        }

    });

    srv.on ('CREATE','Archivos', async req => {

        var jwtToken =  await _fetchJwtToken();

        try {
            var oResp = await  _CreateArchivos(jwtToken,req.data);
            var oRespBody = {
                IDRepositorio : req.data.IDRepositorio,
                IDArchivo:  oResp.properties['cmis:objectId'].value,
                IDCarpeta: req.data.IDCarpeta,
                fileName:  req.data.fileName,
                ContentBase64: req.data.ContentBase64,
                Content: req.data.Content,
                MimeType: req.data.MimeType

            }
            return oRespBody;
            } catch(e){
                req.reject(400, e.response.data.message, []);
    
            }

    });

    srv.on ('READ','Archivos',  async (req,res) => {
        
        var jwtToken =  await _fetchJwtToken();
        var aFilters =    _parseFilters(req.query.SELECT.where);      
  //      var sRepositoryID =  aFilters.find((oElement) =>  oElement.field == 'IDRepositorio' )  ? aFilters.find((oElement) =>  oElement.field == 'IDRepositorio' ).value : "";
  var  sRepositoryID   = req.data.IDRepositorio;
        if(!sRepositoryID){
            req.reject(400, "El filtro IDRepositorio es obligatorio ", []);  
        }
        try {
        var oResp = await _ReadFile(jwtToken, req.data,sRepositoryID);  
       var sB64 = Buffer.from(oResp.data, "binary").toString("base64"); 
         req.res.setHeader('content-disposition',oResp.headers['content-disposition']) ;
    //  req.res.setHeader('content-disposition', 'inline') ;

     // var aResponse = oResp.objects.map((oElement) => {
        var sFileName = oResp.headers['content-disposition'].substring(oResp.headers['content-disposition'].search("filename") + 9 );
        return {
            IDArchivo : req.data.IDArchivo, 
            IDRepositorio :req.data.IDRepositorio ,
            ContentBase64 : `data:${oResp.headers['content-type']};base64,`+ sB64,
            Content: toStream(oResp.data),
            MimeType: oResp.headers['content-type'],
            fileName: sFileName
    



        };
      

      //  });
       
    //    aResponse = _ApplyFilters(aFilters,aResponse);
    //    return aResponse;


    } catch(e){
        req.reject(400, e.response.data.message, []);

    }


    });

    srv.on ('DELETE','Archivos', async req => {

        var oRequestData =  req.data;
        var jwtToken =  await _fetchJwtToken();
        try {
        var oData = await _deleteFile(jwtToken,oRequestData.IDArchivo,oRequestData.IDRepositorio);
       // oRequestData.IDArchivo = oData.IDArchivo;
        return oRequestData;
        } catch(e){
            req.reject(400, e.response.data.message, []);
    
        }

    });

}