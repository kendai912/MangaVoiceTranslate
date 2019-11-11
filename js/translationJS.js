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
  //翻訳画面ロード
  //----------------------------------------------------
  let title = getParam("c");
  let lan = "en";
  console.log(title);

  // Initialize fotorama manually.
  var $fotoramaDiv_original = $(".fotorama_original").fotorama();

  // Get the API object.
  var fotorama_original = $fotoramaDiv_original.data("fotorama");

  //  Load imgs
  let numOfPics = 3;
  for (let i = numOfPics; i > 0; i--) {
    fotorama_original.push({
      // img: "img/LoveHina_p" + i + ".png"
      img: "img/" + title + "_p" + i + ".png"
    });
  }

  setTimeout(function() {
    $(".fotorama__img").attr("style", "top: 0px");
  }, 500);
  fotorama_original.show(numOfPics);

  //----------------------------------------------------
  //ファンクション(画面ロード関連)
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

  //----------------------------------------------------
  //ファンクション(speechRecognition関連)
  //----------------------------------------------------
  const SpeechRecognition = webkitSpeechRecognition || SpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "ja-JP";
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;
  let isListening = false;
  let recognizedText = "";

  function voiceRecognizeStart(outputBox, text) {
    recognition.onsoundstart = event => {
      console.log("音声認識中");
      recognizedText = $(outputBox).val();
    };
    recognition.onnomatch = event => {
      console.log("音声認識でマッチしません");
    };
    recognition.onerror = event => {
      console.log("音声認識エラー");
      if (isListening) {
        console.log("再開");
        voiceRecognizeStart(outputBox, $(outputBox).val());
      }
    };
    recognition.onend = event => {
      console.log("音声認識停止中");
      if (isListening) {
        console.log("再開");
        voiceRecognizeStart(outputBox, $(outputBox).val());
      }
    };
    recognition.onresult = event => {
      recognizedText = text + event.results[0][0].transcript;
      // console.log("text = " + text);
      console.log("transcript = " + event.results[0][0].transcript);
      console.log("outputbox = " + outputBox);
      // console.log("...writing in outputbox = " + recognizedText);

      $(outputBox).val(recognizedText);
      let fukidashiIdSliced;
      if (outputBox.length == 16) {
        fukidashiIdSliced = outputBox.slice(-1);
      } else if (outputBox.length == 17) {
        fukidashiIdSliced = outputBox.slice(-2);
      }
      console.log("fukidashiIdSliced = " + fukidashiIdSliced);
      showTranslatedText(fukidashiIdSliced, recognizedText);
      if (event.results[0].isFinal) {
        console.log("最終結果");
        isListening = false;
        recognition.stop();
        setTimeout(function() {
          console.log("停止後再開");
          // console.log("outputBox = " + $(outputBox).val());
          voiceRecognizeStart(outputBox, $(outputBox).val());
        }, 500);
      }
    };

    try {
      recognition.start();
      isListening = true;
      console.log("音声認識開始");
    } catch (e) {
      console.log("音声認識を既に開始しています");
    }
  }

  function voiceRecognizeReStart(outputBox, text) {
    isListening = false;
    recognition.onsoundstart = event => {
      recognition.stop();
    };
    recognition.onresult = null;
    recognition.stop();
    setTimeout(function() {
      voiceRecognizeStart(outputBox, text);
    }, 500);
  }

  //----------------------------------------------------
  //ファンクション(翻訳関連)
  //----------------------------------------------------
  function showTranslatedText(fukidashiId, text) {
    $.ajax({
      type: "post",
      url: " https://translation.googleapis.com/language/translate/v2", // POST送信先のURL
      dataType: "jsonp",
      data: {
        key: "AIzaSyCUyFedDYTd9DZEOMVlSGofCJrV35EjQbc",
        q: text,
        format: "text",
        source: "ja",
        // target: "en",
        target: lan,
        model: "nmt"
      },
      success: function(json_data) {
        console.log(
          "Json translatedText = " +
            json_data.data.translations[0].translatedText
        );
        console.log("fukidashiId = " + fukidashiId);
        console.log("fukidashiId = " + String(fukidashiId));
        $("#trslatedTextBox" + String(fukidashiId))
          .val(json_data.data.translations[0].translatedText)
          .keyup();
      },
      error: function() {
        // HTTPエラー時
        alert("Server Error. Pleasy try again later.");
      }
    });
  }

  function createFukidashiTextBoxHTML(fukidashiId) {
    let fukidashiTextBoxHTML =
      '<div class="inputTextBox"><div id="no_' +
      String(fukidashiId) +
      '">' +
      String(fukidashiId) +
      '</div><textarea id="voiceInputBox_' +
      String(fukidashiId) +
      '" class="voiceInputBox" cols="60" rows="2"></textarea><textarea id="trslatedTextBox' +
      String(fukidashiId) +
      '" class="trslatedTextBox" cols="60" rows="2"></textarea></div>';

    return fukidashiTextBoxHTML;
  }

  function getPageNum() {
    let pageNum = fotorama_original.activeFrame.img.slice(-6, -4);

    return pageNum;
  }

  function refresh() {
    //初期化処理
    let flagInit = true;
    fukidashiId = 0;
    fukidashiArrayOriginal = {};
    fukidashiArrayTranslated = {};
    $("#translatedPicBox img").attr("src", fotorama_original.activeFrame.img);
    canvas_original.clear().renderAll();
    canvas_translated.clear().renderAll();
    $("#inputTextBoxes").html("");

    //Firebaseのデータをロード
    let pageNum = getPageNum();
    database
      // .ref("LoveHina/" + pageNum + "/" + lan + "/fukidashi")
      .ref(title + "/" + pageNum + "/" + lan + "/fukidashi")
      .on("value", function(data) {
        try {
          $.each(data.val(), function(index, value) {
            //最初の読み込み時のみ
            if (index != 0 && flagInit) {
              fukidashiId = index;

              //テキストボックス＆吹き出しのロード
              $("#inputTextBoxes").append(
                createFukidashiTextBoxHTML(fukidashiId)
              );
              $("#voiceInputBox_" + fukidashiId).val(value.ja);
              $("#trslatedTextBox" + fukidashiId).val(value[lan]);
              loadFukidashiOriginal(
                fukidashiArrayOriginal,
                value.width,
                value.height,
                value.top,
                value.left
              );
              loadFukidashiTranslated(
                fukidashiArrayTranslated,
                value.width,
                value.height,
                value.top,
                value.left
              );
            }
          });

          // テキストボックスイベント設定
          if (flagInit) {
            for (let i = 1; i <= fukidashiId; i++) {
              $("#voiceInputBox_" + i).on("click", function() {
                voiceRecognizeReStart(
                  "#voiceInputBox_" + i,
                  $("#voiceInputBox_" + i).val()
                );
              });

              $("#voiceInputBox_" + i).on("keyup", function() {
                showTranslatedText(i, $("#voiceInputBox_" + i).val());
              });

              $("#trslatedTextBox" + i).on("keyup", function() {
                fukidashiArrayTranslated["canvasText_" + i].set(
                  "text",
                  $("#trslatedTextBox" + i).val()
                );
                canvas_translated.renderAll();

                //Firebaseに保存
                saveInFirebase();
              });
            }
          }

          flagInit = false;
        } catch (e) {
          console.log("firebase is not set");
        }
      });
  }

  //----------------------------------------------------
  //ファンクション(Firebase関連)
  //----------------------------------------------------
  function saveInFirebase() {
    // 画像関連の保存
    let translatedPic = "translatedPic_" + lan;
    let translatedCanvas = "translatedCanvas_" + lan;
    // database.ref("LoveHina/" + getPageNum() + "/" + lan + "/views/").set({
    database.ref(title + "/" + getPageNum() + "/" + lan + "/views/").set({
      // originalPic: JSON.stringify("img/" + title + "_ " + pageNum + ".png"),
      originalPic: JSON.stringify(
        // "img/LoveHina" + "_ " + getPageNum() + ".png"
        "img/" + title + "_ " + getPageNum() + ".png"
      ),
      // translatedPic_en: $("#canvas_translated")[0].toDataURL(),
      // translatedCanvas_en: JSON.stringify(canvas_translated)
      [translatedPic]: $("#canvas_translated")[0].toDataURL(),
      [translatedCanvas]: JSON.stringify(canvas_translated)
    });

    //吹き出し関連の保存
    for (let i = 1; i <= fukidashiId; i++) {
      database
        // .ref("LoveHina/" + getPageNum() + "/" + lan + "/fukidashi/" + i + "/")
        .ref(title + "/" + getPageNum() + "/" + lan + "/fukidashi/" + i + "/")
        .set({
          top: fukidashiArrayTranslated["canvasGroup_" + i].top,
          left: fukidashiArrayTranslated["canvasGroup_" + i].left,
          width: fukidashiArrayTranslated["canvasGroup_" + i].width,
          height: fukidashiArrayTranslated["canvasGroup_" + i].height,
          ja: $("#voiceInputBox_" + i).val(),
          // en: $("#trslatedTextBox" + i).val()
          [lan]: $("#trslatedTextBox" + i).val()
        });
    }
  }

  //----------------------------------------------------
  //ファンクション(Canvas関連)
  //----------------------------------------------------
  function addFukidashiOriginal(
    fukidashiArrayOriginal,
    textWidth,
    textHeight,
    topPosition,
    leftPosition
  ) {
    fukidashiArrayOriginal["canvasRec_" + fukidashiId] = new fabric.Rect({
      width: textWidth,
      height: textHeight,
      fill: "transparent",
      stroke: "blue",
      selectable: false
    });
    fukidashiArrayOriginal["canvasText_" + fukidashiId] = new fabric.Textbox(
      "",
      {
        fill: "white",
        backgroundColor: "Blue",
        fontSize: 10,
        top: -10,
        width: 10,
        height: 10,
        breakWords: true,
        fontWeight: "bold",
        textAlign: "center"
      }
    );
    fukidashiArrayOriginal["canvasGroup_" + fukidashiId] = new fabric.Group(
      [
        fukidashiArrayOriginal["canvasRec_" + fukidashiId],
        fukidashiArrayOriginal["canvasText_" + fukidashiId]
      ],
      {
        top: topPosition - 10,
        left: leftPosition,
        selectable: true
      }
    );
    fukidashiArrayOriginal["canvasText_" + fukidashiId].set(
      "text",
      String(fukidashiId)
    );

    canvas_original.add(fukidashiArrayOriginal["canvasGroup_" + fukidashiId]);
  }

  function addFukidashiTranslated(
    fukidashiArrayTranslated,
    textWidth,
    textHeight,
    topPosition,
    leftPosition
  ) {
    fukidashiArrayTranslated["canvasRec_" + fukidashiId] = new fabric.Rect({
      width: textWidth,
      height: textHeight,
      fill: "#FFFFFF",
      selectable: false
    });
    fukidashiArrayTranslated["canvasText_" + fukidashiId] = new fabric.Textbox(
      "",
      {
        fill: "#000000",
        fontSize: 10,
        top: 0,
        width: textWidth,
        breakWords: true
      }
    );
    fukidashiArrayTranslated["canvasGroup_" + fukidashiId] = new fabric.Group(
      [
        fukidashiArrayTranslated["canvasRec_" + fukidashiId],
        fukidashiArrayTranslated["canvasText_" + fukidashiId]
      ],
      {
        top: topPosition,
        left: leftPosition,
        selectable: true
      }
    );

    canvas_translated.add(
      fukidashiArrayTranslated["canvasGroup_" + fukidashiId]
    );
  }

  function loadFukidashiOriginal(
    fukidashiArrayOriginal,
    width,
    height,
    top,
    left
  ) {
    addFukidashiOriginal(fukidashiArrayOriginal, width, height, top, left);
    fukidashiArrayOriginal["canvasText_" + fukidashiId].set(
      "text",
      String(fukidashiId)
    );
    canvas_original.renderAll();
  }

  function loadFukidashiTranslated(
    fukidashiArrayTranslated,
    width,
    height,
    top,
    left
  ) {
    addFukidashiTranslated(fukidashiArrayTranslated, width, height, top, left);
    fukidashiArrayTranslated["canvasText_" + fukidashiId].set(
      "text",
      $("#trslatedTextBox" + fukidashiId).val()
    );
    canvas_translated.renderAll();
  }

  //----------------------------------------------------
  // Canvas設定
  //----------------------------------------------------

  let mouseDownX;
  let mouseDownY;
  let mouseUpX;
  let mouseUpY;
  let canvas_original = new fabric.Canvas("canvas_original");
  let canvas_translated = new fabric.Canvas("canvas_translated");
  let fukidashiId = 0;
  let fukidashiArrayOriginal = {};
  let fukidashiArrayTranslated = {};
  $(".canvas-container").removeAttr("style");
  $(".lower-canvas").removeAttr("style");
  $(".upper-canvas").removeAttr("style");
  canvas_original.setWidth(400);
  canvas_original.setHeight(548.25);
  canvas_translated.setWidth(400);
  canvas_translated.setHeight(548.25);
  $(".canvas-container").addClass("canvasFmt");
  $(".lower-canvas").addClass("canvasFmt");
  $(".upper-canvas").addClass("canvasFmt");

  //吹き出し内の折返し設定処理
  var _wrapLine = function(_line, lineIndex, desiredWidth, reservedSpace) {
    var lineWidth = 0,
      splitByGrapheme = this.splitByGrapheme,
      graphemeLines = [],
      line = [],
      // spaces in different languges?
      words = splitByGrapheme
        ? fabric.util.string.graphemeSplit(_line)
        : _line.split(this._wordJoiners),
      word = "",
      offset = 0,
      infix = splitByGrapheme ? "" : " ",
      wordWidth = 0,
      infixWidth = 0,
      largestWordWidth = 0,
      lineJustStarted = true,
      additionalSpace = splitByGrapheme ? 0 : this._getWidthOfCharSpacing();

    reservedSpace = reservedSpace || 0;
    desiredWidth -= reservedSpace;
    for (var i = 0; i < words.length; i++) {
      // i would avoid resplitting the graphemes
      word = fabric.util.string.graphemeSplit(words[i]);
      wordWidth = this._measureWord(word, lineIndex, offset);
      offset += word.length;

      // Break the line if a word is wider than the set width
      if (this.breakWords && wordWidth >= desiredWidth) {
        if (!lineJustStarted) {
          line.push(infix);
          lineJustStarted = true;
        }

        // Loop through each character in word
        for (var w = 0; w < word.length; w++) {
          var letter = word[w];
          var letterWidth =
            (this.getMeasuringContext().measureText(letter).width *
              this.fontSize) /
            this.CACHE_FONT_SIZE;
          if (lineWidth + letterWidth > desiredWidth) {
            graphemeLines.push(line);
            line = [];
            lineWidth = 0;
          } else {
            line.push(letter);
            lineWidth += letterWidth;
          }
        }
        word = [];
      } else {
        lineWidth += infixWidth + wordWidth - additionalSpace;
      }

      if (lineWidth >= desiredWidth && !lineJustStarted) {
        graphemeLines.push(line);
        line = [];
        lineWidth = wordWidth;
        lineJustStarted = true;
      } else {
        lineWidth += additionalSpace;
      }

      if (!lineJustStarted) {
        line.push(infix);
      }
      line = line.concat(word);

      infixWidth = this._measureWord([infix], lineIndex, offset);
      offset++;
      lineJustStarted = false;
      // keep track of largest word
      if (wordWidth > largestWordWidth && !this.breakWords) {
        largestWordWidth = wordWidth;
      }
    }

    i && graphemeLines.push(line);

    if (largestWordWidth + reservedSpace > this.dynamicMinWidth) {
      this.dynamicMinWidth = largestWordWidth - additionalSpace + reservedSpace;
    }

    return graphemeLines;
  };

  fabric.util.object.extend(fabric.Textbox.prototype, {
    _wrapLine: _wrapLine
  });

  //----------------------------------------------------
  // Canvasイベント
  //----------------------------------------------------
  $("#clear_btn").on("click", function() {
    // database.ref("LoveHina/" + getPageNum() + "/" + lan + "/views").set({});
    database.ref(title + "/" + getPageNum() + "/" + lan + "/views").set({});
    // database.ref("LoveHina/" + getPageNum() + "/" + lan + "/fukidashi").set({});
    database.ref(title + "/" + getPageNum() + "/" + lan + "/fukidashi").set({});
    fukidashiId = 0;
    canvas_original.clear().renderAll();
    canvas_translated.clear().renderAll();
    $("#inputTextBoxes").html("");
  });

  $(".canvas-container").on("mousedown", function(e) {
    // console.log("マウスダウンした時の座標: " + e.offsetX + ", " + e.offsetY);
    mouseDownX = e.offsetX;
    mouseDownY = e.offsetY;
  });

  $(".canvas-container").on("mouseup", function(e) {
    // console.log("マウスアップした時の座標: " + e.offsetX + ", " + e.offsetY);
    let topPosition;
    let leftPosition;
    let textWidth;
    let textHeight;

    fukidashiId++;
    mouseUpX = e.offsetX;
    mouseUpY = e.offsetY;

    if (mouseDownY < mouseUpY) {
      topPosition = mouseDownY;
      textHeight = mouseUpY - mouseDownY;
    } else {
      topPosition = mouseUpY;
      textHeight = mouseDownY - mouseUpY;
    }
    // console.log("topPosition = " + topPosition);
    // console.log("textHeight = " + textHeight);

    if (mouseDownX < mouseUpX) {
      leftPosition = mouseDownX;
      textWidth = mouseUpX - mouseDownX;
    } else {
      leftPosition = mouseUpX;
      textWidth = mouseDownX - mouseUpX;
    }

    addFukidashiOriginal(
      fukidashiArrayOriginal,
      textWidth,
      textHeight,
      topPosition,
      leftPosition
    );
    addFukidashiTranslated(
      fukidashiArrayTranslated,
      textWidth,
      textHeight,
      topPosition,
      leftPosition
    );
    canvas_original.renderAll();
    canvas_translated.renderAll();

    $("#inputTextBoxes").append(createFukidashiTextBoxHTML(fukidashiId));

    //----------------------------------------------------
    // テキストボックスイベント
    //----------------------------------------------------
    for (let i = 1; i <= fukidashiId; i++) {
      $("#voiceInputBox_" + i).on("click", function() {
        voiceRecognizeReStart(
          "#voiceInputBox_" + i,
          $("#voiceInputBox_" + i).val()
        );
      });

      $("#voiceInputBox_" + i).on("keyup", function() {
        showTranslatedText(i, $("#voiceInputBox_" + i).val());
      });

      $("#trslatedTextBox" + i).on("keyup", function() {
        fukidashiArrayTranslated["canvasText_" + i].set(
          "text",
          $("#trslatedTextBox" + i).val()
        );
        canvas_translated.renderAll();

        //Firebaseに保存
        saveInFirebase();
      });
    }
  });

  //----------------------------------------------------
  //スライド遷移イベント
  //----------------------------------------------------
  $(".fotorama_original").on("fotorama:showend ", function() {
    refresh();
  });

  //----------------------------------------------------
  //言語選択イベント
  //----------------------------------------------------
  $("#translatedLanguage").on("change", function() {
    console.log($(this).val());
    lan = $(this).val();

    refresh();
  });
});
