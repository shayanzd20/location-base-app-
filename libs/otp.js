const axios = require("axios");
const qs = require('querystring')


module.exports.amirKabirOtpRequest = function(number) {
  console.log("number:",number);

  return new Promise(function(resolve, reject) {

    const  requestBody = {
      sid: 'f0d2393d-a625-11e9-9ee8-00505696ce21',
      mobile: number
    }
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'key=88da7455-a624-11e9-9ee8-00505696ce21'
      }
    }
    const url = 'http://panel.techvas.com/api/member/sub';

    console.log(" qs.stringify(requestBody):", qs.stringify(requestBody));
    axios({
      method: 'POST',
      url: url,
      data: qs.stringify(requestBody),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'key=88da7455-a624-11e9-9ee8-00505696ce21'
      }})
      .then(function(response) {
        console.log("response.data in send http.js:", response);
        console.log("response.data in send http.js:", response.data);
        console.log("response.headers in send http.js:", response.headers);
        resolve({
          status: response.status,
          headers: response.headers,
          body: response.data
        });
      })
      .catch(function(error) {
        // console.log("error in send http.js:",error);
        reject(
          {
            error: error
          }
        );
      });
  });
};

module.exports.amirKabirOtpConfirm = function(tid, pin) {

  return new Promise(function(resolve, reject) {

    const  requestBody = {
      tid: tid,
      pin: pin
    }
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'key=88da7455-a624-11e9-9ee8-00505696ce21'
      }
    }
    const url = 'http://panel.techvas.com/api/member/check';

    axios.post(url, qs.stringify(requestBody), config)
      .then(function(response) {
        console.log("response.data in send http.js:", response.data);
        console.log("response.data in send http.js:", response.data);
        console.log("response.headers in send http.js:", response.headers);
        resolve({
          status: response.status,
          headers: response.headers,
          body: response.data
        });
      })
      .catch(function(error) {
        // console.log("error in send http.js:",error);
        reject(
          {
            error: error
          }
        );
      });
  });
};

module.exports.internalOtpRequest = function(number) {
  console.log("number:",number);

  return new Promise(function(resolve, reject) {

    const  requestBody = {
      number: number,
      service: 'VISNO'
    }
    // const url = 'http://5.144.128.207/API/RequestOTP.php';
    const url = 'http://158.58.186.25/API/RequestOTP.php';

    console.log(" qs.stringify(requestBody):", qs.stringify(requestBody));
    axios({
      method: 'POST',
      url: url,
      data: qs.stringify(requestBody),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }})
      .then(function(response) {
        console.log("response.data in send http.js:", response);
        console.log("response.data in send http.js:", response.data);
        console.log("response.headers in send http.js:", response.headers);
        resolve({
          status: response.status,
          headers: response.headers,
          body: response.data
        });
      })
      .catch(function(error) {
        // console.log("error in send http.js:",error);
        reject(
          {
            error: error
          }
        );
      });
  });
};

module.exports.internalOtpConfirm = function(number, pin) {

  return new Promise(function(resolve, reject) {

    const  requestBody = {
      number: number,
      service: 'VISNO',
      pincode: pin
    }
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }
    const url = 'http://158.58.186.25/API/SubmitOTP.php';

    axios.post(url, qs.stringify(requestBody), config)
      .then(function(response) {
        console.log("response.data in send http.js:", response.data);
        console.log("response.data in send http.js:", response.data);
        console.log("response.headers in send http.js:", response.headers);
        resolve({
          status: response.status,
          headers: response.headers,
          body: response.data
        });
      })
      .catch(function(error) {
        // console.log("error in send http.js:",error);
        reject(
          {
            error: error
          }
        );
      });
  });
};

module.exports.internalUserStatus = function(number) {

  return new Promise(function(resolve, reject) {

    const  requestBody = {
      number: number,
      service: 'VISNO'
    }
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }
    const url = 'http://158.58.186.25/API/Status.php';

    console.log("internalUserStatus url:",url);
    axios.post(url, qs.stringify(requestBody), config)
      .then(function(response) {
        // console.log("response.data in send http.js:", response.data);
        // console.log("response.data in send http.js:", response.data);
        // console.log("response.headers in send http.js:", response.headers);
        resolve({
          status: response.status,
          headers: response.headers,
          body: response.data
        });
      })
      .catch(function(error) {
        // console.log("error in send http.js:",error);
        reject(
          {
            error: error
          }
        );
      });
  });
};