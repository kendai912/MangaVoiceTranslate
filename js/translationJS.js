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
  let title;
  // Initialize fotorama manually.
  var $fotoramaDiv_original = $(".fotorama_original").fotorama();

  // Get the API object.
  var fotorama_original = $fotoramaDiv_original.data("fotorama");

  //  Load imgs
  let numOfPics = 3;
  for (let i = numOfPics; i > 0; i--) {
    fotorama_original.push({
      img: "img/LoveHina_p" + i + ".png"
    });
  }

  setTimeout(function() {
    $(".fotorama__img").attr("style", "top: 0px");
  }, 500);
  fotorama_original.show(numOfPics);

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
      // console.log("transcript = " + event.results[0][0].transcript);
      // console.log("outputbox = " + outputBox);
      // console.log("...writing in outputbox = " + recognizedText);

      $(outputBox).val(recognizedText);
      let fukidashiId = outputBox.slice(-1);
      // console.log("fukidashiId = " + fukidashiId);
      showTranslatedText(fukidashiId, recognizedText);
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
        target: "en",
        model: "nmt"
      },
      success: function(json_data) {
        $("#translatedTextBox_" + fukidashiId)
          .html(json_data.data.translations[0].translatedText)
          .change();
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
      fukidashiId +
      '">' +
      fukidashiId +
      '</div><textarea id="voiceInputBox_' +
      fukidashiId +
      '" class="voiceInputBox" cols="60" rows="2"></textarea><textarea id="translatedTextBox_' +
      fukidashiId +
      '" class="translatedTextBox" cols="60" rows="2"></textarea></div>';

    return fukidashiTextBoxHTML;
  }

  function getPageNum() {
    let pageNum = fotorama_original.activeFrame.img.slice(-6, -4);

    return pageNum;
  }

  //----------------------------------------------------
  //ファンクション(Firebase関連)
  //----------------------------------------------------
  function saveInFirebase() {
    // 画像関連の保存
    database.ref("LoveHina/" + getPageNum() + "/views/").set({
      // originalPic: JSON.stringify("img/" + title + "_ " + pageNum + ".png"),
      originalPic: JSON.stringify(
        "img/LoveHina" + "_ " + getPageNum() + ".png"
      ),
      translatedPic_en: $("#canvas_translated")[0].toDataURL(),
      translatedCanvas_en: JSON.stringify(canvas_translated)
    });

    //吹き出し関連の保存
    for (let i = 1; i <= fukidashiId; i++) {
      database
        .ref("LoveHina/" + getPageNum() + "/fukidashi/" + fukidashiId + "/")
        .set({
          top: fukidashiArray["canvasGroup_" + fukidashiId].top,
          left: fukidashiArray["canvasGroup_" + fukidashiId].left,
          width: fukidashiArray["canvasGroup_" + fukidashiId].width,
          height: fukidashiArray["canvasGroup_" + fukidashiId].height,
          ja: $("#voiceInputBox_" + fukidashiId).val(),
          en: $("#translatedTextBox_" + fukidashiId).val()
        });
    }
  }

  //----------------------------------------------------
  //ファンクション(Canvas関連)
  //----------------------------------------------------
  function addFukidashi(
    fukidashiArray,
    textWidth,
    textHeight,
    topPosition,
    leftPosition
  ) {
    fukidashiArray["canvasRec_" + fukidashiId] = new fabric.Rect({
      width: textWidth,
      height: textHeight,
      fill: "#FFFFFF",
      selectable: false
    });
    fukidashiArray["canvasText_" + fukidashiId] = new fabric.Textbox("", {
      fill: "#000000",
      fontSize: 10,
      top: 0,
      width: textWidth,
      breakWords: true
    });
    fukidashiArray["canvasGroup_" + fukidashiId] = new fabric.Group(
      [
        fukidashiArray["canvasRec_" + fukidashiId],
        fukidashiArray["canvasText_" + fukidashiId]
      ],
      {
        top: topPosition,
        left: leftPosition,
        selectable: true
      }
    );

    canvas_translated.add(fukidashiArray["canvasGroup_" + fukidashiId]);
  }

  function loadFukidashi(fukidashiArray, width, height, top, left) {
    addFukidashi(fukidashiArray, width, height, top, left);
    fukidashiArray["canvasText_" + fukidashiId].set(
      "text",
      $("#translatedTextBox_" + fukidashiId).val()
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
  let fukidashiArray = {};
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
    database.ref("LoveHina/" + getPageNum() + "/views").set({});
    database.ref("LoveHina/" + getPageNum() + "/fukidashi").set({});
    fukidashiId = 0;
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
    // console.log("leftPosition = " + leftPosition);
    // console.log("textWidth = " + textWidth);

    // fukidashiArray["canvasRec_" + fukidashiId] = new fabric.Rect({
    //   width: textWidth,
    //   height: textHeight,
    //   fill: "#FFFFFF",
    //   selectable: false
    // });
    // fukidashiArray["canvasText_" + fukidashiId] = new fabric.Textbox("", {
    //   fill: "#000000",
    //   fontSize: 10,
    //   top: 0,
    //   width: textWidth,
    //   breakWords: true
    // });
    // fukidashiArray["canvasGroup_" + fukidashiId] = new fabric.Group(
    //   [
    //     fukidashiArray["canvasRec_" + fukidashiId],
    //     fukidashiArray["canvasText_" + fukidashiId]
    //   ],
    //   {
    //     top: topPosition,
    //     left: leftPosition,
    //     selectable: true
    //   }
    // );

    // canvas_translated.add(fukidashiArray["canvasGroup_" + fukidashiId]);
    addFukidashi(
      fukidashiArray,
      textWidth,
      textHeight,
      topPosition,
      leftPosition
    );
    canvas_translated.renderAll();

    $("#inputTextBoxes").append(createFukidashiTextBoxHTML(fukidashiId));

    //----------------------------------------------------
    // テキストボックスイベント
    //----------------------------------------------------
    $("#voiceInputBox_" + fukidashiId).on("click", function() {
      voiceRecognizeStart("#voiceInputBox_" + fukidashiId, "");
    });

    $("#translatedTextBox_" + fukidashiId).on("change", function() {
      fukidashiArray["canvasText_" + fukidashiId].set(
        "text",
        $("#translatedTextBox_" + fukidashiId).val()
      );
      canvas_translated.renderAll();

      //Firebaseに保存
      saveInFirebase();
    });
  });

  //----------------------------------------------------
  //スライド遷移イベント
  //----------------------------------------------------
  $(".fotorama_original").on("fotorama:showend ", function() {
    //初期化処理
    let flagInit = true;
    fukidashiId = 0;
    fukidashiArray = {};
    $("#translatedPicBox img").attr("src", fotorama_original.activeFrame.img);
    canvas_translated.clear().renderAll();
    $("#inputTextBoxes").html("");

    //Firebaseのデータをロード
    let pageNum = getPageNum();
    database
      .ref("LoveHina/" + pageNum + "/fukidashi")
      .on("value", function(data) {
        try {
          console.log(data.val());
          $.each(data.val(), function(index, value) {
            //最初の読み込み時のみロード
            if (index != 0 && flagInit) {
              console.log("index = " + index);
              console.log("value = " + value);
              fukidashiId = index;
              $("#inputTextBoxes").append(
                createFukidashiTextBoxHTML(fukidashiId)
              );
              $("#voiceInputBox_" + fukidashiId).val(value.ja);
              $("#translatedTextBox_" + fukidashiId).val(value.en);
              loadFukidashi(
                fukidashiArray,
                value.width,
                value.height,
                value.top,
                value.left
              );
            }
          });
          flagInit = false;
        } catch (e) {
          console.log("firebase is not set");
        }
      });
  });
});
