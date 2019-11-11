$(function() {
  "use strict";

  //----------------------------------------------------
  // Initialize Firebase
  //----------------------------------------------------
  var firebaseConfig = {
    apiKey: "AIzaSyDibY6sMrN_-0SRMqvaUv3KihMr40S1kPw",
    authDomain: "mangavoicetranslate.firebaseapp.com",
    databaseURL: "https://mangavoicetranslate.firebaseio.com",
    projectId: "mangavoicetranslate",
    storageBucket: "mangavoicetranslate.appspot.com",
    messagingSenderId: "92503418443",
    appId: "1:92503418443:web:20c310c244fe69c42c4fce",
    measurementId: "G-8NHH83679X"
  };

  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();

  //----------------------------------------------------
  // 元画像ロード
  //----------------------------------------------------
  let title;
  // Initialize fotorama manually.
  var $fotoramaDiv_viewer = $(".fotorama_viewer").fotorama();

  // Get the API object.
  var fotorama_viewer = $fotoramaDiv_viewer.data("fotorama");

  //  Load imgs
  let numOfPics = 3;
  for (let i = numOfPics; i > 0; i--) {
    fotorama_viewer.push({
      img: "img/LoveHina_p" + i + ".png"
    });
  }

  setTimeout(function() {
    $(".fotorama__img").attr("style", "top: 0px");
  }, 400);
  fotorama_viewer.show(numOfPics);

  //----------------------------------------------------
  // ファンクション
  //----------------------------------------------------
  function getPageNum() {
    let pageNum = fotorama_viewer.activeFrame.img.slice(-6, -4);
    return pageNum;
  }

  //----------------------------------------------------
  //イベント(翻訳吹き出しロード)
  //----------------------------------------------------
  //初期読み込み
  $(".fotorama_viewer").on("fotorama:ready ", function() {
    let pageNum = getPageNum();
    database.ref("LoveHina/" + pageNum + "/views").on("value", function(data) {
      try {
        $("#viewerTranslatedPic").attr("src", data.val().translatedPic_en);
      } catch (e) {
        console.log("translatedPic on firebase is not set");
      }
    });
  });
  //画面スライド時
  $(".fotorama_viewer").on("fotorama:show ", function() {
    let pageNum = getPageNum();
    database.ref("LoveHina/" + pageNum + "/views").on("value", function(data) {
      try {
        $("#viewerTranslatedPic").attr("src", data.val().translatedPic_en);
      } catch (e) {
        console.log("translatedPic on firebase is not set");
      }
    });
  });
});
