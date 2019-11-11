$(function() {
  "use strict";

  let title = getParam("c");
  let lan = "en";

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
  // Initialize fotorama manually.
  var $fotoramaDiv_viewer = $(".fotorama_viewer").fotorama();

  // Get the API object.
  var fotorama_viewer = $fotoramaDiv_viewer.data("fotorama");

  //  Load imgs
  let numOfPics = 3;
  for (let i = numOfPics; i > 0; i--) {
    fotorama_viewer.push({
      // img: "img/LoveHina_p" + i + ".png"
      img: "img/" + title + "_p" + i + ".png"
    });
  }

  setTimeout(function() {
    $(".fotorama__img").attr("style", "top: 0px");
  }, 400);
  fotorama_viewer.show(numOfPics);

  //----------------------------------------------------
  // ファンクション
  //----------------------------------------------------
  function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  function getPageNum() {
    let pageNum = fotorama_viewer.activeFrame.img.slice(-6, -4);
    return pageNum;
  }

  function refresh() {
    let pageNum = getPageNum();
    $("#viewerTranslatedPic").attr("src", "");
    database
      // .ref("LoveHina/" + pageNum + "/" + lan + "/views")
      .ref(title + "/" + pageNum + "/" + lan + "/views")
      .on("value", function(data) {
        try {
          $("#viewerTranslatedPic").attr(
            "src",
            data.val()["translatedPic_" + lan]
          );
        } catch (e) {
          console.log("translatedPic on firebase is not set");
        }
      });
  }

  //----------------------------------------------------
  //イベント
  //----------------------------------------------------
  //初期読み込み
  $(".fotorama_viewer").on("fotorama:ready ", function() {
    refresh();
  });
  //画面スライド時
  $(".fotorama_viewer").on("fotorama:show ", function() {
    refresh();
  });
  //言語選択変更時
  $("#translatedLanguageViewer").on("change", function() {
    lan = $("#translatedLanguageViewer").val();
    refresh();
  });
});
