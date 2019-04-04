$(document).ready(function() {
  $('.snum').click(function() {
    dirty(this.id, $(this).val());
  });
  $('.sdate').click(function() {
    dirty(this.id, $(this).val());
  });
  $('.sdel').click(function() {
    dirty(this.id, $(this).val());
  });
  $('.sdelfr').click(function() {
    dirtyfruitreport(this.id, $(this).val());
  });
  $(".datefield").datepicker({dateFormat: "dd/mm/yy"});
  $('#buttSaveOffer').click(function() {
    saveOffer();
  });
  $('#buttBuyNowContract').click(function() {
    buyNowContract();
  });
  $('#buttSendOffer').click(function() {
    sendOffer();
  });
  $('#buttRejectOffer').click(function() {
    rejectOffer();
  });
  $('#buttReinstateOffer').click(function() {
    reinstateOffer();
  });
  $('#buttCancelOffer').click(function() {
    cancelOffer();
  });
  $('#Reject').click(function() {
    showReject();
  });
  $('#buttCounterOffer').click(function() {
    counterOffer();
  });
  $('#buttAcceptOffer').click(function() {
    acceptOffer();
  });
  $('#buttDraftOfferPDF').click(function() {
    launchDraftPDF();
  });
  $('#buttDraftSaveOfferPDF').click(function() {
    draftSaveOfferPDF();
  });
  $('#buttRemakePDF').click(function() {
    remakePDF();
  });
  $('#buttSubmitTender').click(function() {
    submitTender();
  });
  $('#buttSaveTender').click(function() {
    saveTender();
  });
  $('#buttEarlySendSubmissionSamplesTender').click(function() {
    earlySendTenderSamples();
  });
  $('#buttEarlySendSubmissionShortlistTender').click(function() {
    earlySendTenderShortlist('');
  });
  $('#buttEarlySendSubmissionShortlistSamplesTender').click(function() {
    earlySendTenderShortlist('requestsamples');
  });
  $('#buttDeleteTender').click(function() {
    deleteTender();
  });
  $('#buttAddWineToTender').click(function() {
    addWineToTender();
  });
  $('#buttRemoveWineFromTender').click(function() {
    removeWineFromTender();
  });
  //Indices selects
  $('.iselect').change(function() {
    updateIndices();
  });
  $('.icheck').click(function() {
    updateIndices();
  });
  //Home page show attendance
  $('.showattend').click(function() {
    var elemId = $(this).attr('id');
    var attend = $(this).prop('checked');
    setShowAttend(elemId, attend);
  });
  //Dialog
  $("#dialog").dialog({autoOpen: false});
  //Action arrow
  $("#actionarrow").effect("bounce", {
    times: 10,
    distance: 100
  }, 5000);
  $('.deleteListItem').click(function() {
    var prodid = $(this).attr('id');
    deleteListingItem(prodid);
  });
  $(".buynow :input").focus(function() {
    var idButt = strRight(this.name, '-');
    $('#submitbuttbuynow-' + idButt).slideDown();
  });
  $('#silentmode').click(function() {
	silentMode();
  });
});

$.fn.serializeObject = function() {
  var o = {};
  var a = this.serializeArray();
  $.each(a, function() {
    if (o[this.name]) {
      if (!o[this.name].push) {
        o[this.name] = [o[this.name]];
      }
      o[this.name].push(this.value || '');
    } else {
      o[this.name] = this.value || '';
    }
  });
  return o;
};

function addSampleRequest(prodID, userID, action) {
  $("#loadingCart").fadeIn('slow');
  // make AJAX request
  var sampleID = '';
  $.ajax({
    url: ajaxurl,
    type: 'post',
    dataType: 'json',
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "addSample",
      "nonce": nonce,
      "prodID": prodID,
      "userID": userID,
      "actiondetail": action
    },
    beforeSend: function() {
      $("#sampleCart").fadeOut('fast');
      $(".ui-button-text").css("cursor", "progress");
      $('#dialogcontent').html('<h2>Adding to Request Cart</h2>');
      $("#dialoginteraction").dialog("open");
    },
    success: function(obj) {
      $(".ui-button-text").css("cursor", "default");
      if (obj.response == 'success') {
        // success
        listSamplesPanel(obj.userID, obj.prod);
        sampleID = obj.sampleID;
        if (action == 'createsampleandoffer') {
          makeOffer(userID, sampleID, '', '');
        } else {
          var $info = obj.htmlinfo;
          if ($info != null) {
            //Write any htmlinfo to the dialog box
            $('#dialogcontent').html($info);
            setTimeout(function() {
              $("#dialoginteraction").dialog("close");
            }, 1500);
          }
          //Update the request count
          var slhtml = $('#slcount').html();
          var slcount = slhtml.replace(/[()]/g, '');
          slcount = parseInt(slcount) + 1;
          $('#slcount').html('(' + slcount + ')');
        }
      } else if (obj.response == 'failed') {
        // failed
      }
    }
  });
}

function addToShortlist(prodID, userID, action, buynowID) {
  $("#loadingCart").fadeIn('slow');
  // make AJAX request
  $.ajax({
    url: ajaxurl,
    type: 'post',
    dataType: 'json',
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "addToShortlist",
      "nonce": nonce,
      "prodID": prodID,
      "userID": userID,
      "actiondetail": action
    },
    beforeSend: function() {
      $("#sampleCart").fadeOut('fast');
      $(".ui-button-text").css("cursor", "progress");
    },
    success: function(obj) {
      $(".ui-button-text").css("cursor", "default");
      if (obj.response == 'success') {
        // success
        listSamplesPanel(obj.userID, obj.prod);
        shortID = obj.shortID;
        if (action == 'offer') {
          makeOfferFromShortlist(shortID, userID);
        } else if (action == 'offerbuynow') {
          makeBuyNowOfferFromShortlist(shortID, buynowID, userID);
        } else {
          var $info = obj.htmlinfo;
          if ($info != null) {
            //Write any htmlinfo to the dialog box
            $('#dialogcontent').html($info);
            $("#dialoginteraction").dialog("open");
            setTimeout(function() {
              $("#dialoginteraction").dialog("close");
            }, 1500);
          }
        }
      } else if (obj.response == 'failed') {
        // failed
      }
    }
  });
}

function removeItemFromShortlist(shortlistID, userID) {
  //make AJAX request
  $.ajax({
    url: ajaxurl,
    type: 'post',
    dataType: 'json',
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "removeItemFromShortlist",
      "nonce": nonce,
      "shortlistID": shortlistID,
      "userID": userID
    },
    beforeSend: function() {
      $("#remfsl-" + shortlistID).css("cursor", "progress");
    },
    success: function(obj) {
      $("#remfsl-" + shortlistID).css("cursor", "default");
      if (obj.response == 'success') {
        //success
        $('#slidinfo').val(shortlistID);
        var $info = obj.htmlinfo;
        if ($info != null) {
          //Write any htmlinfo to the dialog box
          $('#dialogcontent').html($info);
          $("#dialoginteraction").dialog("open");
        } else {
          removeItemFromShortlistConfirmed(userID);
        }
      } else if (obj.response == 'failed') {
        // failed
      }
    }
  });
}

function removeItemFromShortlistConfirmed(userID) {
  //make AJAX request
  var shortlistID = $('#slidinfo').val();
  $.ajax({
    url: ajaxurl,
    type: 'post',
    dataType: 'json',
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "removeItemFromShortlistConfirmed",
      "nonce": nonce,
      "shortlistID": shortlistID,
      "userID": userID
    },
    beforeSend: function() {
      $("#remfsl-" + shortlistID).css("cursor", "progress");
    },
    success: function(obj) {
      $("#remfsl-" + shortlistID).css("cursor", "default");
      if (obj.response == 'success') {
        // success
        //Hide the row
        $('#row-' + shortlistID).slideToggle('500');
        var slhtml = $('#slcount').html();
        var slcount = slhtml.replace(/[()]/g, '');
        slcount = parseInt(slcount) - 1;
        $('#slcount').html('(' + slcount + ')');
      } else if (obj.response == 'failed') {
        // failed
      }
    }
  });
}

function sampleRequestShortlistToggle(shortID, userID, action) {
  $("#sreq-" + shortID).slideToggle('500');
}

function sampleFromShortlist(shortID, userID, action) {
  //Check the number and date have been completed
  var numrequested = $('#snum' + shortID).val();
  var daterequired = $('#sdate' + shortID).val();
  if (!validateNumValue(numrequested, 'No. of Samples'))
    return (false);
  if (!validateSampleDate(daterequired, 'Date Required'))
    return (false);

  // make AJAX request
  var sampleID = '';
  $.ajax({
    url: ajaxurl,
    type: 'post',
    dataType: 'json',
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "sampleFromShortlist",
      "nonce": nonce,
      "shortID": shortID,
      "userID": userID,
      "numrequested": numrequested,
      "daterequired": daterequired,
      "actiondetail": action
    },
    beforeSend: function() {
      //$("#sampleCart").fadeOut('fast');
      $(".ui-button-text").css("cursor", "progress");
    },
    success: function(obj) {
      $(".ui-button-text").css("cursor", "default");
      if (obj.response == 'success') {
        // success
        sampleID = obj.sampleID;
        if (action == 'createsampleandoffer') {
          makeOffer(userID, sampleID, '', '');
        }
        //self.location.reload();
        sampleRequestShortlistToggle(shortID, userID, action);
        updateShortlistActivity(userID, '');
        //Add number to sample requests sent count
        var srshtml = $('#srscount').html();
        var srscount = srshtml.replace(/[()]/g, '');
        srscount = parseInt(srscount) + 1;
        $('#srscount').html('(' + srscount + ')');
      } else if (obj.response == 'failed') {
        // failed
      }
    }
  });
}

function validateSampleDate(thevalue, descField) {
  if (thevalue == "") {
    alert("Please enter a deadline date for delivery of sample. Allowing a week will normally be enough time for a supplier to fill the request.");
    return (false);
  }
  return (true);
}

function listSamplesPanel(userID, prodcat) {
  $("#loadingCart").fadeIn('slow');
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "samplePanel",
      "nonce": nonce,
      "userID": userID
    },
    success: function(data) {
      listSamples(data, prodcat);
      $("#sampleCart").fadeIn('slow');
      $("#loadingCart").fadeOut('fast');
    },
    failure: function() {
      alert("Sorry, unable to load sample requests");
    }
  });
}

function listSamples(jsondata, prodcat) {
  var tbody = $("#sampleTable > tbody").html("");
  //for (var i in jsondata) {
  //var j = jsondata[i];
  //	var rowText = "<tr><td>" + j.ProductType + "</td><td>" + j.Vintage + "</td><td>" + j.Variety + "</td></tr>";
  //	$(rowText).appendTo(tbody);
  //}
  if (jsondata.fruit.length == 0 && jsondata.bulk.length == 0 && jsondata.bottled.length == 0) {
    if (prodcat == 'Bottled Wine') {
      var thead = $("#sampleTable > thead").html("<tr><th>Shortlist is Empty</th></tr>");
    } else {
      var thead = $("#sampleTable > thead").html("<tr><th>Sample Cart is Empty</th></tr>");
    }

  } else {
    //var thead = $("#sampleTable > thead").html("<tr><th>Batch/Brand</th><th>Vintage</th><th>Variety</th></tr>");
    var thead = $("#sampleTable > thead").html("");
    switch (prodcat) {
      case 'Fruit':
        if (jsondata.fruit.length > 0) {
          var rowText = "<tr><th colspan=4>Fruit</th></tr>";
          $(rowText).appendTo(tbody);
        }
        $.each(jsondata.fruit, function(i, item) {
          var rowText = "<tr><td>" + item.BatchNumber + "</td><td>" + item.Vintage + "</td><td>" + item.Variety + "</td><td>" + item.GI + "</td></tr>";
          $(rowText).appendTo(tbody);
        });
        break;
      case 'Bulk Wine':
        if (jsondata.bulk.length > 0) {
          var rowText = "<tr><th colspan=4>Bulk Wine</th></tr>";
          $(rowText).appendTo(tbody);
        }
        $.each(jsondata.bulk, function(i, item) {
          var rowText = "<tr><td>" + item.BatchNumber + "</td><td>" + item.Vintage + "</td><td>" + item.Variety + "</td><td>" + item.GI + "</td></tr>";
          $(rowText).appendTo(tbody);
        });
        break;
      case 'Bottled Wine':
        var vint = '';
        if (jsondata.bottled.length > 0) {
          var rowText = "<tr><th colspan=4>Bottled Wine</th></tr>";
          $(rowText).appendTo(tbody);
        }
        $.each(jsondata.bottled, function(i, item) {
          if (item.Vintage == 0) {
            vint = 'Non-vintage';
          } else {
            vint = item.Vintage;
          }
          var rowText = "<tr><td>" + item.BrandName + "</td><td>" + vint + "</td><td>" + item.Variety + "</td><td>" + item.GI + "</td></tr>";
          $(rowText).appendTo(tbody);
        });
        break;
    }
  }
}

function updateShortlistActivity(userID) {
  //Loop all the slactiv divs and populate
  //$("#loadingCart").fadeIn('slow');
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "updateShortlistActivity",
      "nonce": nonce,
      "userID": userID
    },
    success: function(jsondata) {
      $.each(jsondata.divcontents, function(i, item) {
        $('#' + item.divid).html(item.contents);
      });
      $(".niceli a").button();
      //$("#sampleCart").fadeIn('slow');
      //$("#loadingCart").fadeOut('fast');
    },
    failure: function() {
      alert("Sorry, unable to update shortlist activity");
    }
  });
}

function dirty(id, value) {
  $('#submitRequest').fadeOut('fast');
  $('#saveRequest').fadeIn('slow');
}
function dirtyfruitreport(id, value) {
  //If some of the fruit deletes are checked then switch buttons
  if ($(".sdelfr").is(':checked')) {
    $('#submitFruitRequest').fadeOut('fast');
    $('#saveFruitReport').fadeIn('slow');
  } else {
    $('#saveFruitReport').fadeOut('fast');
    $('#submitFruitRequest').fadeIn('slow');
  }

}
function updatedSamples(data) {
  if (data.reload == 'true') {
    self.location.reload();
  } else {
    $("#loadingSampleTable").fadeOut('fast');
    $('#submitRequest').fadeIn('slow');
  }
}

function saveRequests() {
  $("#loadingSampleTable").fadeIn('slow');
  $('#saveRequest').fadeOut('fast');
  jsonsnum = $.toJSON($('#frmSampleRequests .snum').serializeObject());
  jsonsdate = $.toJSON($('#frmSampleRequests .sdate').serializeObject());
  jsonsdel = $.toJSON($('#frmSampleRequests .sdel').serializeObject());
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "updateSampleNumbers",
      "nonce": nonce,
      "datasnum": jsonsnum,
      "datasdate": jsonsdate,
      "datasdel": jsonsdel
    },
    success: function(data) {
      updatedSamples(data);
    },
    failure: function() {
      alert("Sorry, unable to save sample requests");
    }
  });
}

function saveRequestsFruitReport() {
  $("#loadingFruitReportTable").fadeIn('slow');
  $('#saveRequestFruitReport').fadeOut('fast');
  jsonsnum = $.toJSON($('#frmFruitReport .snum').serializeObject());
  jsonsdate = $.toJSON($('#frmFruitReport .sdate').serializeObject());
  jsonsdel = $.toJSON($('#frmFruitReport .sdelfr').serializeObject());
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "updateSampleNumbers",
      "nonce": nonce,
      "datasnum": jsonsnum,
      "datasdate": jsonsdate,
      "datasdel": jsonsdel
    },
    success: function(data) {
      updatedSamples(data);
    },
    failure: function() {
      alert("Sorry, unable to save sample requests");
    }
  });
}

function submitRequests(userID) {
  //Check that all the requested date fields have been completed.
  var alldates = true;
  $('.sdate').each(function(i, obj) {
    if ($(obj).val() == '') {
      alldates = false;
    }
  });
  if (alldates) {
    $("#loadingSampleTable").fadeIn('slow');
    $('#submitRequest').fadeOut('fast');
    $.ajax({
      url: ajaxurl,
      type: "post",
      dataType: "json",
      cache: false,
      data: {
        "action": "ajax_request",
        "a": "submitRequests",
        "nonce": nonce,
        "userID": userID
      },
      success: function(data) {
        if (data.recordsmailed == 0) {
          alert('Sorry, there was an issue mailing these requests.\nPlease contact the Winescape administrator.');
        };
        self.location.reload();
      },
      failure: function() {
        alert("Sorry, unable to send sample requests");
      }
    });
  } else {
    alert('Please enter a date required for all sample requests.');
  }
}

function submitFruitRequest(userID) {
  $("#loadingFruitReportTable").fadeIn('slow');
  $('#submitFruitRequest').fadeOut('fast');
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "submitFruitRequest",
      "nonce": nonce,
      "userID": userID
    },
    success: function(data) {
      if (data.recordsmailed == 0) {
        alert('Sorry, there was an issue mailing the vineyard contact.\nPlease contact the Winescape administrator.');
      };
      //self.location.href=data.url;
      self.location.reload();
    },
    failure: function() {
      alert("Sorry, unable to raise vineyard contacts");
    }
  });
}

function saveSampleAction(a) {
  if ($('#action').val() == '') {
    alert('Please select a new status');
    return false;
  } else if (!$('#productListing input[type="checkbox"]').is(':checked')) {
    alert("Please check at least one item to action.");
    return false;
  } else {
    $('#submitSampleStatus').fadeOut('fast');
    var jsonsaction = $.toJSON($('#frmSampleRequests .saction').serializeObject());
    var newstatus = $('#action').val();
    var comment = $('#actioncomment').val();
    var requesturl = self.location.href;
    $.ajax({
      url: ajaxurl,
      type: "post",
      dataType: "json",
      cache: false,
      data: {
        "action": "ajax_request",
        "a": a,
        "nonce": nonce,
        "newstatus": newstatus,
        "comment": comment,
        "datasaction": jsonsaction,
        "requesturl": requesturl
      },
      success: function(data) {
        $('#actioncomment').val('');
        //alert (data.url);
        //self.location.reload();
        self.location.href = data.url;
      },
      failure: function() {
        alert("Sorry, unable to save sample requests");
      }
    });
  }
}

function shortlistSampleStatus(sampleID) {
  $('#samloading-' + sampleID).fadeIn('fast');
  var samplestatus = $('#samstat-' + sampleID).val();
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "shortlistSaveSampleStatus",
      "nonce": nonce,
      "sampleID": sampleID,
      "samplestatus": samplestatus
    },
    success: function(data) {
      if (samplestatus == 'Received') {
        //Add number to sample requests received count
        var srhtml = $('#srrcount').html();
        var scount = srhtml.replace(/[()]/g, '');
        scount = parseInt(scount) + 1;
        $('#srrcount').html('(' + scount + ')');
        //Subtract number to sample requests in transit count
        var srhtml = $('#srtcount').html();
        var scount = srhtml.replace(/[()]/g, '');
        scount = parseInt(scount) - 1;
        $('#srtcount').html('(' + scount + ')');
      } else if (samplestatus == 'Samples Sent') {
        //Subtract number to sample requests received count
        var srhtml = $('#srrcount').html();
        var scount = srhtml.replace(/[()]/g, '');
        scount = parseInt(scount) - 1;
        $('#srrcount').html('(' + scount + ')');
        //Add number to sample requests in transit count
        var srhtml = $('#srtcount').html();
        var scount = srhtml.replace(/[()]/g, '');
        scount = parseInt(scount) + 1;
        $('#srtcount').html('(' + scount + ')');
      }
      $('#samloading-' + sampleID).fadeOut('slow');
    },
    failure: function() {
      alert("Sorry, unable to update the sample status");
    }
  });
}

function makeOffer(userID, sampleID, rowID, a) {
  $('#boffer' + rowID).fadeOut('fast');
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "makeOffer",
      "nonce": nonce,
      "userID": userID,
      "sampleID": sampleID
    },
    success: function(data) {
      self.location.href = data.url;
    },
    failure: function() {
      alert("Sorry, unable to make an offer");
    }
  });
}

function makeOfferFromShortlist(shortID, userID) {
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "makeOfferFromShortlist",
      "nonce": nonce,
      "shortID": shortID,
      "userID": userID
    },
    success: function(data) {
      self.location.href = data.url;
    },
    failure: function() {
      alert("Sorry, unable to make an offer");
    }
  });
}

function raiseSubsequentOffer(contractID, userID) {
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "raiseSubsequentOffer",
      "nonce": nonce,
      "contractID": contractID,
      "userID": userID
    },
    success: function(data) {
      self.location.href = data.url;
    },
    failure: function() {
      alert("Sorry, unable to make the subsequent offer");
    }
  });
}

function makeBuyNowOfferFromShortlist(shortID, buynowID, userID) {
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "makeBuyNowOfferFromShortlist",
      "nonce": nonce,
      "shortID": shortID,
      "buynowID": buynowID,
      "userID": userID
    },
    success: function(data) {
      if (data.message !== '') {
        alert(data.message)
      } else {
        self.location.href = data.url;
      }
    },
    failure: function() {
      alert("Sorry, unable to make a buy now offer");
    }
  });
}

function makeBuyNowOfferFromShortlisPopUp(shortID, buynowID, userID) {
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "makeBuyNowOfferFromShortlist",
      "nonce": nonce,
      "shortID": shortID,
      "buynowID": buynowID,
      "userID": userID
    },
    beforeSend: function() {
      $("#remfsl-" + shortID).css("cursor", "progress");
    },
    success: function(obj) {
      $("#remfsl-" + shortID).css("cursor", "default");
      if (obj.response == 'success') {
        //success
        var $info = obj.htmlinfo;
        //Write any htmlinfo to the dialog box
        $('#dialogcontent').html($info);
        $("#dialoginteraction").dialog("option", "dialogClass", "noTitleStuff");
        $("#dialoginteraction").dialog("option", "width", "80%");
        $("#dialoginteraction").dialog("option", "buttons", [
          {
            text: "Send to Supplier",
            click: function() {
              $(this).dialog("close");
            }
          }
        ]);
        $("#dialoginteraction").dialog("open");
      } else if (obj.response == 'failed') {
        // failed
      }
    },
    failure: function() {
      alert("Sorry, unable to make a buy now offer");
    }
  });
}

function makeOfferShow(userID, sampleID, rowID, a) {
  $('#boffer' + rowID).fadeOut('fast');
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "makeOfferShow",
      "nonce": nonce,
      "userID": userID,
      "sampleID": sampleID
    },
    success: function(data) {
      self.location.href = data.url;
    },
    failure: function() {
      alert("Sorry, unable to make an offer");
    }
  });
}

function requestRepeatSample(userID, sampleID, rowID, a) {
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "requestRepeatSample",
      "nonce": nonce,
      "userID": userID,
      "sampleID": sampleID,
      "rowID": rowID
    },
    beforeSend: function() {
      $(".ui-button").css("cursor", "progress");
    },
    success: function(data) {
      $(".ui-button").css("cursor", "default");
      $("#dialog").dialog('open');
      setTimeout(function() {
        $("#dialog").dialog("close");
      }, 3000);
      //self.location.href=data.url;
    },
    failure: function() {
      alert("Sorry, unable to create the repeat sample request");
    }
  });
}

function saveOffer() {
  $("#loadingStuff").fadeIn('slow');
  $('#saveOffer').fadeOut('fast');
  jsonForm = $.toJSON($('#frmOffer').serializeObject());
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "saveOffer",
      "nonce": nonce,
      "dataForm": jsonForm
    },
    success: function(data) {
      //$("#loadingStuff").fadeOut('fast');
      //$('#saveOffer').fadeIn('slow');
      self.location.href = data.url;
    },
    failure: function() {
      alert("Sorry, unable to save the offer");
    }
  });
}


function sendOffer() {
  //Validate
  if (!$('[name="frmOffer"]').valid()) {
    $('#validationfailed').slideDown('slow');
    setTimeout(function() {
      $('#validationfailed').slideUp('slow');
    }, 5000);
    return false;
  } else {
    $("#dialoginteractionsig").dialog("open");
    $("#dialoginteractionsig").dialog({ title: "Send Offer" });
    $("#dialoginteractionsig").dialog({ action: "sendOffer" });
    if ($("#signature").jSignature('getData') == undefined) {
      $("#signature").jSignature();
      $("#signature").bind('change', function(e){
        enableDisContinue();
      })
    }
  }
}

function buyNowContract() {
  //Validate
  if (!$('[name="frmOffer"]').valid()) {
    $('#validationfailed').slideDown('slow');
    setTimeout(function() {
      $('#validationfailed').slideUp('slow');
    }, 5000);
    return false;
  } else {
    $('#buynowpurchaseqty').html($('#QtyRequired').val());
    $('#buynowfreight').html($('#FreightFee').val());
    $("#dialoginteractionII").dialog("open");
  }
}

function buyNowContractSubmit() {
  $("#dialoginteractionsig").dialog("open");
  $("#dialoginteractionsig").dialog({ title: "Buy Now Acceptance" });
  $("#dialoginteractionsig").dialog({ action: "buyNowContract" });
  if ($("#signature").jSignature('getData') == undefined) {
    $("#signature").jSignature();
    $("#signature").bind('change', function(e){
      enableDisContinue();
    })
  }
}

// function buyNowContractSubmit() {
//   //Submit
//   $("#loadingStuff").fadeIn('slow');
//   $('#sendOffer').fadeOut('fast');
//   jsonForm = $.toJSON($('#frmOffer').serializeObject());
//   $.ajax({
//     url: ajaxurl,
//     type: "post",
//     dataType: "json",
//     cache: false,
//     data: {
//       "action": "ajax_request",
//       "a": "buyNowContract",
//       "nonce": nonce,
//       "dataForm": jsonForm
//     },
//     success: function(data) {
//       $('#nexturl').val(data.url);
//       $("#dialoginteractionIII").dialog("open");
//     },
//     failure: function() {
//       alert("Sorry, unable to complete the buy now contract");
//     }
//   });
// }

function rejectOffer() {
  $("#Reject").prop('checked', true);
  showReject();
}

function reinstateOffer() {
  $("#loadingStuff").fadeIn('slow');
  $('#saveOffer').fadeOut('fast');
  $("#Reinstate").val('Reinstate');
  jsonForm = $.toJSON($('#frmOffer').serializeObject());
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "reinstateOffer",
      "nonce": nonce,
      "dataForm": jsonForm
    },
    success: function(data) {
      //$("#loadingStuff").fadeOut('fast');
      //$('#saveOffer').fadeIn('slow');
      self.location.href = data.url;
    },
    failure: function() {
      alert("Sorry, unable to reinstate the offer");
    }
  });
}

function showReject() {
  if ($("#Reject").is(':checked')) {
    $("#rejectOffer").fadeOut('fast');
    $("#sendOffer").fadeOut('fast');
    $("#acceptOffer").fadeOut('fast');
    $("#counterOffer").fadeOut('fast');
    $("#cancelOffer").fadeOut('fast');
    $("#offerRejectReason").fadeIn('slow');
    $("#saveRejectOffer").fadeIn('slow');
  } else {
    $("#rejectOffer").fadeIn('slow');
    $("#sendOffer").fadeIn('slow');
    $("#acceptOffer").fadeIn('slow');
    $("#counterOffer").fadeIn('slow');
    $("#cancelOffer").fadeIn('slow');
    $("#offerRejectReason").fadeOut('fast');
    $("#saveRejectOffer").fadeOut('fast');
  }
}

function counterOffer() {
  $("#loadingStuff").fadeIn('slow');
  $('#counterOffer').fadeOut('fast');
  jsonForm = $.toJSON($('#frmOffer').serializeObject());
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "counterOffer",
      "nonce": nonce,
      "dataForm": jsonForm
    },
    success: function(data) {
      self.location.href = data.url;
    },
    failure: function() {
      alert("Sorry, unable to send the counter offer");
    }
  });
}

function acceptOffer() {
  $("#dialoginteractionsig").dialog("open");
  $("#dialoginteractionsig").dialog({ title: "Offer Acceptance" });
  $("#dialoginteractionsig").dialog({ action: "acceptOffer" });
  if ($("#signature").jSignature('getData') == undefined) {
    $("#signature").jSignature();
    $("#signature").bind('change', function(e){
      enableDisContinue();
    })
  }
}
function enableDisContinue () {
  if ($("#signature").jSignature('isModified') && $('#SignatureIdentity').val() !== '') {
    $("#signaturecontinue").button('enable');
    $("#signaturesave").button('enable');
  } else {
    $("#signaturecontinue").button('disable');
    $("#signaturesave").button('disable');
  }
}
function continueSigned(action) {
  $("#loadingStuff").fadeIn('slow');
  $('#' + action).fadeOut('fast');
  jsonForm = $.toJSON($('#frmOffer').serializeObject());
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": action,
      "nonce": nonce,
      "dataForm": jsonForm
    },
    success: function(data) {
      if (action === 'buyNowContract') {
        $('#nexturl').val(data.url);
        $("#dialoginteractionIII").dialog("open");
      } else {
        self.location.href = data.url;
      }
    },
    failure: function() {
      alert("Sorry, unable to continue");
    }
  });
}
function saveSignature() {
  $("#SavedSignature").val( $("#signature").jSignature("getData") );
  jsonForm = $.toJSON($('#frmOffer').serializeObject());
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "saveSignature",
      "nonce": nonce,
      "dataForm": jsonForm
    },
    success: function(data) {
      $("#signaturesave").button('disable');
      $("#signatureusesaved").button('enable');
    },
    failure: function() {
      alert("Sorry, unable to continue");
    }
  });
}
function useSavedSignature() {
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "useSavedSignature",
      "nonce": nonce
    },
    success: function(data) {
      $("#signature").jSignature("setData", data.signatureimage)
      $("#signaturecontinue").button('enable');
      $("#signaturesave").button('enable');
    },
    failure: function() {
      alert("Sorry, unable to continue");
    }
  });
}
function useWSAuthSignature() {
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "useWSAuthSignature",
      "nonce": nonce
    },
    success: function(data) {
      $("#signature").jSignature("setData", data.signatureimage)
      $("#signaturecontinue").button('enable');
      $("#signaturesave").button('enable');
    },
    failure: function() {
      alert("Sorry, unable to continue");
    }
  });
}


function draftSaveOfferPDF() {
  var answer = confirm("Generate PDF without accepting offer? (DRAFT ONLY)");
  if (answer) {
    //Save first
    jsonForm = $.toJSON($('#frmOffer').serializeObject());
    $.ajax({
      url: ajaxurl,
      type: "post",
      dataType: "json",
      cache: false,
      async: false,
      data: {
        "action": "ajax_request",
        "a": "saveOffer",
        "nonce": nonce,
        "dataForm": jsonForm
      },
      success: function(data) {
        launchDraftPDF()
      },
      failure: function() {
        alert("Sorry, unable to save the offer");
      }
    });
  }
}

function remakePDF() {
  $("#loadingStuff").fadeIn('slow');
  var contractID = $('#contractid').val();
  var perspective = $('#perspective').val();
  var answer = confirm("Regenerate contract PDF?");
  if (answer) {
    $.ajax({
      url: ajaxurl,
      type: "post",
      dataType: "json",
      cache: false,
      async: false,
      data: {
        "action": "ajax_request",
        "a": "remakePDF",
        "nonce": nonce,
        "contractID": contractID,
        "perspective": perspective
      },
      success: function(data) {
        var win = window.open(data.url, '_blank');
          if (win) {
            //Browser has allowed it to be opened
            win.focus();
          } else {
            //Browser has blocked it
            alert("Please enable popups for this website");
          }
          $("#loadingStuff").fadeOut('slow');
          //Point the PDF link to the ID for newly created file
          $("[title='View Contract']").attr('href', data.url);
      },
      failure: function() {
        alert("Sorry, unable to remake the contract PDF.");
      }
    });
  }
}

function launchDraftPDF() {
  $("#loadingStuff").fadeIn('slow');
  jsonForm = $.toJSON($('#frmOffer').serializeObject());
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    //must be synchronous for browser to trust popup
    async: false,
    data: {
      "action": "ajax_request",
      "a": "draftOfferPDF",
      "nonce": nonce,
      "dataForm": jsonForm
    },
    success: function(data) {
      var win = window.open(data.url, '_blank');
        if (win) {
          //Browser has allowed it to be opened
          win.focus();
        } else {
          //Browser has blocked it
          alert("Please enable popups for this website");
        }
        $("#loadingStuff").fadeOut('slow');
    },
    failure: function() {
      alert("Sorry, unable to generate PDF");
    }
  });
}

function cancelOffer() {
  $("#loadingStuff").fadeIn('slow');
  $('#saveOffer').fadeOut('fast');
  jsonForm = $.toJSON($('#frmOffer').serializeObject());
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "cancelOffer",
      "nonce": nonce,
      "dataForm": jsonForm
    },
    success: function(data) {
      //$("#loadingStuff").fadeOut('fast');
      //$('#saveOffer').fadeIn('slow');
      self.location.href = data.url;
    },
    failure: function() {
      alert("Sorry, unable to save the offer");
    }
  });
}

function submitTender() {
  //Validate
  if (!validateTender())
    return (false);
  $("#loadingStuff").fadeIn('slow');
  $('#submitTender').fadeOut('fast');
  jsonForm = $.toJSON($('#frmTender').serializeObject());
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "submitTender",
      "nonce": nonce,
      "dataForm": jsonForm
    },
    success: function(data) {
      //$("#loadingStuff").fadeOut('fast');
      //$('#saveOffer').fadeIn('slow');
      self.location.href = data.url;
    },
    failure: function() {
      alert("Sorry, unable to submit the tender");
    }
  });
}

function saveTender() {
  //Validate
  if (!validateTender())
    return (false);
  $("#loadingStuff").fadeIn('slow');
  $('#saveTender').fadeOut('fast');
  jsonForm = $.toJSON($('#frmTender').serializeObject());
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "saveTender",
      "nonce": nonce,
      "dataForm": jsonForm
    },
    success: function(data) {
      //$("#loadingStuff").fadeOut('fast');
      //$('#saveOffer').fadeIn('slow');
      self.location.href = data.url;
    },
    failure: function() {
      alert("Sorry, unable to save the tender");
    }
  });
}

function earlySendTenderSamples() {
  //Validate
  if (!validateTender())
    return (false);
  var answer = confirm("Send out the sample requests for submissions on this tender?");
  if (answer) {
    $("#loadingStuff").fadeIn('slow');
    $('#earlySendTenderSamples').fadeOut('fast');
    jsonForm = $.toJSON($('#frmTender').serializeObject());
    $.ajax({
      url: ajaxurl,
      type: "post",
      dataType: "json",
      cache: false,
      data: {
        "action": "ajax_request",
        "a": "earlySendTenderSamples",
        "nonce": nonce,
        "dataForm": jsonForm
      },
      success: function(data) {
        //$("#loadingStuff").fadeOut('fast');
        //$('#saveOffer').fadeIn('slow');
        self.location.href = data.url;
      },
      failure: function() {
        alert("Sorry, unable to early send the sample requests");
      }
    });
  }
}

function earlySendTenderShortlist(requestsamples) {
  //Validate
  if (!validateTender())
    return (false);
  var answer = confirm("Shortlist the submissions on this tender?");
  if (answer) {
    $("#loadingStuff").fadeIn('slow');
    $('#earlySendTenderShortlist').fadeOut('fast');
    jsonForm = $.toJSON($('#frmTender').serializeObject());
    $.ajax({
      url: ajaxurl,
      type: "post",
      dataType: "json",
      cache: false,
      data: {
        "action": "ajax_request",
        "a": "earlySendTenderShortlist",
        "nonce": nonce,
        "requestsamples": requestsamples,
        "dataForm": jsonForm
      },
      success: function(data) {
        //$("#loadingStuff").fadeOut('fast');
        //$('#saveOffer').fadeIn('slow');
        self.location.href = data.url;
      },
      failure: function() {
        alert("Sorry, unable to early create the shortist items");
      }
    });
  }
}

function deleteTender() {
  var answer = confirm("Cancel this tender and move to the tender archive?");
  if (answer) {
    $("#loadingStuff").fadeIn('slow');
    $('#saveTender').fadeOut('fast');
    jsonForm = $.toJSON($('#frmTender').serializeObject());
    $.ajax({
      url: ajaxurl,
      type: "post",
      dataType: "json",
      cache: false,
      data: {
        "action": "ajax_request",
        "a": "deleteTender",
        "nonce": nonce,
        "dataForm": jsonForm
      },
      success: function(data) {
        self.location.href = data.url;
      },
      failure: function() {
        alert("Sorry, unable to delete the tender");
      }
    });
  }
}

function validateTender() {
  with (document.forms['frmTender']) {
    //if (!validateCombo(ProductType, 'Product Type')) return(false);
    if(!validateText(Vintage, 'Vintage'))
      return (false);
    if (!validateText(Variety, 'Variety'))
      return (false);
    if (!validateText(GI, 'GI'))
      return (false);
    if (!validateText(Quantity, 'Quantity Required'))
      return (false);
    if (!validateNumber(Quantity, 'Quantity Required'))
      return (false);
    if (!validateText(Price, 'Target Price'))
      return (false);
    if (!validateNumber(Price, 'Target Price'))
      return (false);
    if (!validateText(ClosingDate, 'Closing Date'))
      return (false);
    if (!dateCheck(ClosingDate.value, '%d/%m/%y')) {
      ClosingDate.focus();
      return (false);
    }
    //Compare closing date UK style only
    var d = (strLeft(ClosingDate.value, '/'));
    var m = (strLeft(strRight(ClosingDate.value, '/'), "/"));
    var y = (strRight(strRight(ClosingDate.value, '/'), "/"));
    var x = new Date(y, m - 1, d);
    var today = new Date();
    if (x <= today) {
      var r = confirm("Warning, closing date is in the past this tender will be saved into the Tender Archive. Continue?");
      if (r != true) {
        return false;
      }
    }
  }
  return true;
}

function addWineToTender() {
  $('#addWineToTender').fadeOut('fast');
  $("#loadingStuff").fadeIn('slow');
  var jsonsaction = $.toJSON($('#frmAddWineToTender .saction').serializeObject());
  var tenderid = $('#tenderid').val();
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "addWineToTender",
      "nonce": nonce,
      "tenderid": tenderid,
      "datasaction": jsonsaction
    },
    success: function(data) {
      self.location.reload();
    },
    failure: function() {
      alert("Sorry, unable to create tender submissions");
    }
  });
}

function removeWineFromTender() {
  $('#buttRemoveWineFromTender').fadeOut('fast');
  $("#loadingMoreStuff").fadeIn('slow');
  var jsonsaction = $.toJSON($('#frmTenderSubmissions .saction').serializeObject());
  var tenderid = $('#tenderid').val();
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "removeWineFromTender",
      "nonce": nonce,
      "tenderid": tenderid,
      "datasaction": jsonsaction
    },
    success: function(data) {
      self.location.reload();
    },
    failure: function() {
      alert("Sorry, unable to create tender submissions");
    }
  });
}

function saveCancelContract() {
  if ($('#Cancelled').val() == '') {
    alert('Please enter a cancelled date');
  } else {
    jsonForm = $.toJSON($('#frmCancel').serializeObject());
    $.ajax({
      url: ajaxurl,
      type: "post",
      dataType: "json",
      cache: false,
      data: {
        "action": "ajax_request",
        "a": "cancelContract",
        "nonce": nonce,
        "dataForm": jsonForm
      },
      success: function(data) {
        self.location.reload();
      },
      failure: function() {
        alert("Sorry, unable to cancel the contact");
      }
    });
  }
}

function saveReinstateContract() {
  jsonForm = $.toJSON($('#frmCancel').serializeObject());
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "reinstateContract",
      "nonce": nonce,
      "dataForm": jsonForm
    },
    success: function(data) {
      self.location.reload();
    },
    failure: function() {
      alert("Sorry, unable to reinstate the contact");
    }
  });
}

function deleteFile(fileid) {
  if (!confirm('Are you sure you want to delete this file?')) { return };
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "deleteFile",
      "nonce": nonce,
      "fileid": fileid
    },
    success: function(data) {
      //self.location.reload();
      listAttachments();
    },
    failure: function() {
      alert("Sorry, unable to delete the attached file.");
    }
  });
}

function revisedOfferCancelledContract() {
  jsonForm = $.toJSON($('#frmCancel').serializeObject());
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "revisedOfferCancelledContract",
      "nonce": nonce,
      "dataForm": jsonForm
    },
    success: function(data) {
      self.location.href = data.url;
    },
    failure: function() {
      alert("Sorry, unable to revise the contact");
    }
  });
}

function getGIsForStateZone() {
  $("#loadingGIs").fadeIn('slow');
  strStateZone = $('#isz').val();
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "getGIsForStateZone",
      "nonce": nonce,
      "statezone": strStateZone
    },
    success: function(data) {
      if (data.message == 'Insufficient permissions!') {
        alert('Sorry, you need to be logged in to get all the selector features.');
      } else {
        var arrOptions = new Array();
        $.each(data.gis, function(i, item) {
          arrOptions[i] = item;
        });
        updateSelectChoicesForField('#igi', arrOptions);
      }
      $("#loadingGIs").fadeOut('fast');
      updateIndices();
    },
    failure: function() {
      alert("Sorry, unable to load indices");
    }
  });
}

function productSearchParameters(strFieldUpdated, strUpdate) {
  var strCountry = $('#country').val();
  var strState = $('#state').val();
  var strZone = $('#zone').val();
  var strRegion = $('#region').val();
  var strSubRegion = $('#subregion').val();
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "getProductSearchParameters",
      "nonce": nonce,
      "fieldupdated": strFieldUpdated,
      "country": strCountry,
      "state": strState,
      "zone": strZone,
      "region": strRegion,
      "subregion": strSubRegion
    },
    success: function(data) {
      if (data.message == 'Insufficient permissions!') {
        alert('Sorry, you need to be logged in to get all the search features.');
      } else {
        var arrOptions = new Array();
        $.each(data.states, function(i, item) {
          arrOptions[i] = item;
        });
        updateSelectChoicesForField('#state', arrOptions);
        var arrOptions = new Array();
        $.each(data.zones, function(i, item) {
          arrOptions[i] = item;
        });
        updateSelectChoicesForField('#zone', arrOptions);
        var arrOptions = new Array();
        $.each(data.regions, function(i, item) {
          arrOptions[i] = item;
        });
        updateSelectChoicesForField('#region', arrOptions);
        var arrOptions = new Array();
        $.each(data.subregions, function(i, item) {
          arrOptions[i] = item;
        });
        updateSelectChoicesForField('#subregion', arrOptions);
        if (strUpdate == 'indice') {
          updateIndices();
        }
      }

    },
    failure: function() {
      alert("Sorry, unable to load product search");
    }
  });
}

function updateSelectChoicesForField(updateField, arrOptions) {
  //select optons
  //arrOptions.sort()
  var defaultValue = $(updateField).val();
  //Single value select code
  var options = '';
  for (var i = 0; i < arrOptions.length; i++) {
    /*if ($.inArray(arrOptions[i], defaultValue) !== -1){
			var strSelected = "selected ";
		} else {
			var strSelected = "";
		}*/
    if (arrOptions[i] == defaultValue) {
      var strSelected = "selected ";
    } else {
      var strSelected = "";
    }
    options += '<option ' + strSelected + 'value="' + arrOptions[i] + '">' + arrOptions[i] + '</option>';
  }
  $(updateField).html(options);
}

function isInArray(a) {
  var o = {};
  for (var i = 0; i < a.length; i++) {
    o[a[i]] = '';
  }
  return o;
}

function updateIndices() {
  if ($('#IndiceType').val() == 'Trends') {
    updateTrend();
  } else {
    updateIndice();
  }
}

function updateIndice() {
  var snapdate = $('#isnapdate').val();
  var prodtype = $('#iprodtype').val();
  var vintage = $('#ivintage').val();
  var country = $('#country').val();
  var state = $('#state').val();
  var zone = $('#zone').val();
  var region = $('#region').val();
  var subregion = $('#subregion').val();

  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "getIndicesChartData",
      "nonce": nonce,
      "snapdate": snapdate,
      "prodtype": prodtype,
      "vintage": vintage,
      "country": country,
      "state": state,
      "zone": zone,
      "region": region,
      "subregion": subregion
    },
    success: function(data) {
      updateIndicesChart(data.prodtype, data.variety, data.volume, data.price, data.minprice, data.maxprice, data.ticks, data.ylabel1, data.ylabel2);
    },
    failure: function() {
      alert("Sorry, unable to update the indices chart");
    }
  });
}

function updateIndicesChart(prodtype, variety, volume, price, minprice, maxprice, ticks, ylabel1, ylabel2) {
  $('#indicesYlabel1').html(ylabel1);
  $('#indicesYlabel2').html(ylabel2);
  var jvolume = JSON.parse(volume);
  var jprice = JSON.parse(price);
  var jminprice = JSON.parse(minprice);
  var jmaxprice = JSON.parse(maxprice);
  var jticks = JSON.parse(ticks);
  var data = [
    {
      label: 'Volume',
      data: jvolume,
      bars: {
        show: true,
        barWidth: 0.9,
        align: 'center'
      },
      color: '#7a935b'
    }, {
      label: 'Avg Price',
      data: jprice,
      yaxis: 2,
      lines: {
        show: true,
        steps: false
      },
      color: '#a51e30',
      points: {
        show: false
      }
    }, {
      label: 'Min Price',
      data: jminprice,
      yaxis: 2,
      lines: {
        show: true,
        steps: false
      },
      color: '#ccccff'
    }, {
      label: 'Max Price',
      data: jmaxprice,
      yaxis: 2,
      lines: {
        show: true,
        steps: false
      },
      color: '#9999ff'
    }
  ];
  var options = {
    legend: {
      position: "nw",
      margin: 10
    },
    xaxis: {
      ticks: jticks
    },
    yaxes: [
      {
        min: 0,
        tickFormatter: yaxisVolume
      }, {
        position: 'right',
        min: 0,
        tickFormatter: yaxisCurrency
      }
    ],
    grid: {
      hoverable: true,
      clickable: false
    },
    plothover: showPrice
  };
  $.plot($('#chartindices'), data, options);
  createTooltip();
  $('#contentcontainer').css({height: parseInt($('#contentcontainer').css('height')) + 80 + 'px'});
  $('#chartindices').bind('plothover', showPrice);
}

function updateTrend() {
  var prodtype = $('#iprodtype').val();
  var variety = $('#ivariety').val();
  var vintage = $('#ivintage').val();
  var country = $('#country').val();
  var state = $('#state').val();
  var zone = $('#zone').val();
  var region = $('#region').val();
  var subregion = $('#subregion').val();
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "getTrendsChartData",
      "nonce": nonce,
      "prodtype": prodtype,
      "variety": variety,
      "vintage": vintage,
      "country": country,
      "state": state,
      "zone": zone,
      "region": region,
      "subregion": subregion
    },
    success: function(data) {
      updateTrendsChart(data.prodtype, data.variety, data.volume, data.price, data.minprice, data.maxprice, data.ticks, data.ylabel1, data.ylabel2);
    },
    failure: function() {
      alert("Sorry, unable to update the trends chart");
    }
  });
}

function updateTrendsChart(prodtype, variety, jvolume, jprice, jminprice, jmaxprice, jticks, ylabel1, ylabel2) {
  $('#indicesYlabel1').html(ylabel1);
  $('#indicesYlabel2').html(ylabel2);
  // console.log(volume);
  // var jvolume = JSON.parse(volume);
  // var jprice = JSON.parse(price);
  // var jminprice = JSON.parse(minprice);
  // var jmaxprice = JSON.parse(maxprice);
  // var jticks = JSON.parse(ticks);
  // var jdates = JSON.parse(dates);
  var data = [
    {
      label: 'Volume',
      data: jvolume,
      bars: {
        show: true,
        barWidth: 30*24*3600*500,
        align: 'center'
      },
      color: '#7a935b'
    }, {
      label: 'Avg Price',
      data: jprice,
      yaxis: 2,
      lines: {
        show: true,
        steps: false
      },
      color: '#a51e30',
      points: {
        show: false
      }
    }, {
      label: 'Min Price',
      data: jminprice,
      yaxis: 2,
      lines: {
        show: true,
        steps: false
      },
      color: '#ccccff'
    }, {
      label: 'Max Price',
      data: jmaxprice,
      yaxis: 2,
      lines: {
        show: true,
        steps: false
      },
      color: '#9999ff'
    }
  ];
  var options = {
    legend: {
      position: "nw",
      margin: 10,
      title: 'Yow'
    },
    xaxis: {
      mode: "time"
    },
    yaxes: [
      {
        min: 0,
        tickFormatter: yaxisVolume
      }, {
        position: 'right',
        min: 0,
        tickFormatter: yaxisCurrency,
        labelWidth: 30
      }
    ],
    grid: {
      hoverable: true,
      clickable: false
    },
    plothover: showPrice
  };
  $.plot($('#charttrends'), data, options);
  createTooltip();
  $('#charttrends').bind('plothover', showPrice);
  $('#charttrends').bind('mouseout', hideTooltip);
}

function getIndiceRandom() {
  r = getRandomInt(1, 7);
  if (r == 1) {
    $('#indicetitle').html('<p>History Snapshot - Australian Wine</p>');
    var snapdate = 'Live Data';
    var variety = 'All';
    var prodtype = 'Bulk Wine';
    var vintage = 'All';
    var country = 'Australia';
    var state = '';
    var zone = '';
    var region = '';
    var subregion = '';
  } else if (r == 2) {
    $('#indicetitle').html('<p>History Snapshot - Western Australian Sauvignon Blanc</p>');
    var snapdate = 'Live Data';
    var variety = 'saub';
    var prodtype = 'Bulk Wine';
    var vintage = 'All';
    var country = 'Australia';
    var state = 'Western Australia';
    var zone = '';
    var region = '';
    var subregion = '';
  } else if (r == 3) {
    $('#indicetitle').html('<p>History Snapshot - Western Australian Shiraz</p>');
    var snapdate = 'Live Data';
    var variety = 'shi';
    var prodtype = 'Bulk Wine';
    var vintage = 'All';
    var country = 'Australia';
    var state = 'Western Australia';
    var zone = '';
    var region = '';
    var subregion = '';
  } else if (r == 4) {
    $('#indicetitle').html('<p>History Snapshot - Margaret River Cabernet Sauvignon</p>');
    var snapdate = 'Live Data';
    var variety = 'cabs';
    var prodtype = 'Bulk Wine';
    var vintage = 'All';
    var country = 'Australia';
    var state = '';
    var zone = '';
    var region = 'Margaret River';
    var subregion = '';
  } else if (r == 5) {
    $('#indicetitle').html('<p>History Snapshot - Margaret River Chardonnay</p>');
    var snapdate = 'Live Data';
    var variety = 'cha';
    var prodtype = 'Bulk Wine';
    var vintage = 'All';
    var country = 'Australia';
    var state = '';
    var zone = '';
    var region = 'Margaret River';
    var subregion = '';
  } else if (r == 6) {
    $('#indicetitle').html('<p>History Snapshot - South East Australian Shiraz</p>');
    var snapdate = 'Live Data';
    var variety = 'shi';
    var prodtype = 'Bulk Wine';
    var vintage = 'All';
    var country = 'Australia';
    var state = 'South East Australia';
    var zone = '';
    var region = '';
    var subregion = '';
  } else if (r == 7) {
    $('#indicetitle').html('<p>History Snapshot - South East Australian Cabernet Sauvignon</p>');
    var snapdate = 'Live Data';
    var variety = 'cabs';
    var prodtype = 'Bulk Wine';
    var vintage = 'All';
    var country = 'Australia';
    var state = 'South East Australia';
    var zone = '';
    var region = 'Margaret River';
    var subregion = '';
  }

  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "getTrendsChartData",
      "nonce": nonce,
      "prodtype": prodtype,
      "variety": variety,
      "vintage": vintage,
      "country": country,
      "state": state,
      "zone": zone,
      "region": region,
      "subregion": subregion
    },
    success: function(data) {
      updateTrendsChart(data.prodtype, data.variety, data.volume, data.price, data.minprice, data.maxprice, data.ticks, data.ylabel1, data.ylabel2);
    },
    failure: function() {
      alert("Sorry, unable to update the trends chart");
    }
  });
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setShowAttend(elemID, attend) {
  $("#loadingStuff").fadeIn('slow');
  var shownum = strRight(elemID, 'showattend');
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "setShowAttend",
      "nonce": nonce,
      "shownum": shownum,
      "attend": attend
    },
    success: function(data) {
      $("#loadingStuff").fadeOut('fast');
    },
    failure: function() {
      alert("Sorry, unable to update your show attendance");
    }
  });
}

//Prevent double submit
isub = 0;
function validateandsubmit(reopen) {
  if (isub == 0) {
    isub++;
    //Validate
    console.log($('#GI').val());
    if (!$('[name="frmBottled"]').valid()) {
      isub = 0;
      return false;
    } else {
      $('#Reopen').val(reopen);
      //Submit
      $('#BottleSize').attr('disabled', false);
      $('[name="frmBottled"]').submit();
    }
  } else {
    alert("Your request is being processed.");
    return false;
  }
}

function clearVintage() {
  if ($('#NonVintage').prop('checked')) {
    $('#Vintage').val('');
  } else if ($('#Vintage').val() != '') {
    $('#NonVintage').prop('checked', false);
  }
}

function clearCleanskin(action) {
  if (action == 'check') {
    if ($('#Cleanskin').prop('checked')) {
      $('#BrandName').val('Cleanskin');
    }
  } else if (action == 'field') {
    if ($('#BrandName').val() == 'Cleanskin') {
      $('#Cleanskin').prop('checked', true);
    } else {
      $('#Cleanskin').prop('checked', false);
    }
  }
}

function deleteListingItem(prodid) {
  var dialog = $("<div>Are you sure you want to delete this item from your listing?</div>");
  $(dialog).dialog({
    title: 'Confirm Action',
    resizable: true,
    modal: true,
    width: "40em",
    autoOpen: false,
    buttons: {
      "Yes": function() {
        deleteListingItemConfirmed(prodid);
        $(this).dialog("close");
      },
      "No": function() {
        $(this).dialog("close");
      }
    }
  });
  $(dialog).dialog("open");
}

function deleteListingItemConfirmed(prodid) {
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "deleteListingItem",
      "nonce": nonce,
      "prodID": prodid
    },
    success: function(data) {
      $('#row-' + prodid).slideUp('slow', function() {
        clearInvalidClasses(prodid);
        setListingUpdatedDisplayDate();
      });
    },
    failure: function() {
      alert("Sorry, unable to delete this item");
    }
  });
}

function clearInvalidClasses(prodid) {
  $('#' + prodid + '-Variety').removeClass('invaliddata');
  $('#' + prodid + '-GI').removeClass('invaliddata');
  $('#' + prodid + '-Vintage').removeClass('invaliddata');
  $('#' + prodid + '-BatchNumber').removeClass('invaliddata');
  $('#' + prodid + '-Quantity').removeClass('invaliddata');
  $('#' + prodid + '-Price').removeClass('invaliddata');
  checkInvalidData();
}

function getBottleCodes() {
  var strBottleSupplier = $('#BottleSupplier').val();
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "getBottleCodes",
      "nonce": nonce,
      "bottlesupplier": strBottleSupplier
    },
    success: function(data) {
      if (data.message == 'Insufficient permissions!') {
        alert('Sorry, you need to be logged in to see this information.');
      } else {
        var arrOptions = new Array();
        $.each(data.bottlecodes, function(i, item) {
          arrOptions[i] = item;
        });
        updateSelectChoicesForField('#BottleCode', arrOptions);
        updateBottleDescription();
      }

    },
    failure: function() {
      alert("Sorry, unable to update the bottle information.");
    }
  });
}

function updateBottleDescription() {
  var strBottleSupplier = $('#BottleSupplier').val();
  var strBottleCode = $('#BottleCode').val();
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "updateBottleDescription",
      "nonce": nonce,
      "bottlesupplier": strBottleSupplier,
      "bottlecode": strBottleCode
    },
    success: function(data) {
      if (data.bottlecode == '') {
        $('#BottleSize').attr('disabled', false);
        $('#BottleShape').show();
        $('#BottleDescInfo').hide();
        $('#btlurl').slideUp('slow');
      } else {
        $('#BottleSize').attr('disabled', true);
        $('#BottleShape').hide();
        $('#BottleDescInfo').show();
        $('#btlurl').slideDown('slow');
        $('#BottleSize').val(data.bottlesize);
        $('#BottleDescInfo').val(data.bottledesc);
        $('#BottleURLInfo').html('<a href="' + data.bottleurl + '" target="_blank">Link to Bottle Information</a>');
      }
    },
    failure: function() {
      alert("Sorry, unable to update the bottle information.");
    }
  });
}

function getVarietiesForSelect(strFieldID) {
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "getVarietiesForSelect",
      "nonce": nonce
    },
    success: function(data) {
      if (data.message == 'Insufficient permissions!') {
        alert('Sorry, you need to be logged in.');
      } else {
        var arrOptions = new Array();
        $.each(data.varieties, function(i, item) {
          arrOptions[i] = item;
        });
        updateSelectChoicesForField('#' + strFieldID, arrOptions);
      }
    },
    failure: function() {
      alert("Sorry, unable to update");
    }
  });
}

function getGIsForSelect(strFieldID, defaultValue) {
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "getGIsForSelect",
      "nonce": nonce
    },
    success: function(data) {
      if (data.message == 'Insufficient permissions!') {
        alert('Sorry, you need to be logged in.');
      } else {
        //Check for default value, may be bad data
        var found = false;
        $.each(data.gis, function(i, item) {
          if (defaultValue == item) {
            found = true;
          };
        });
        var arrOptions = new Array();
        //The good data
        $.each(data.gis, function(i, item) {
          arrOptions[i] = item;
        });
        if (!found) {
          arrOptions[arrOptions.length] = defaultValue;
        }
        updateSelectChoicesForField('#' + strFieldID, arrOptions);
      }
    },
    failure: function() {
      alert("Sorry, unable to update");
    }
  });
}

function addInlineBulk() {
  $('#row-newproduct').show();
  editInlineBulk('newproduct');
}

function editInlineBulk(prodid) {
  if (globalEditFields) {
    return false;
  }
  globalEditFields = true;
  //Hide edits
  $('.ebutt').switchClass('ebutt', 'ebutth');
  $('.dbutt').switchClass('dbutt', 'dbutth');
  $('#' + prodid + '-Cancel').switchClass('cbutth', 'cbutt');
  $('#' + prodid + '-Save').switchClass('sbutth', 'sbutt');
  //Show the helper
  $('#extruderBottom').show();
  //Existing
  globalEditProdID = prodid;
  globalExistingVariety = $('#' + prodid + '-Variety').html();
  globalExistingGI = $('#' + prodid + '-GI').html();
  globalExistingVintage = $('#' + prodid + '-Vintage').html();
  globalExistingBatch = $('#' + prodid + '-BatchNumber').html();
  globalExistingQuantity = $('#' + prodid + '-Quantity').html();
  globalExistingPrice = $('#' + prodid + '-Price').html().replace('$', '');
  strHTML = '<input name="' + prodid + '-INLINE-Variety" id="' + prodid + '-INLINE-Variety" value="' + globalExistingVariety + '" class="validvariety" />';
  //strHTML = '<select name="'+prodid+'-INLINE-Variety" id="'+prodid+'-INLINE-Variety" style="width:20em" multiple="multiple"><option value="'+globalExistingVariety+'" selected>'+globalExistingVariety+'</option></select>';
  //strHTML = '<select name="'+prodid+'-INLINE-Variety" id="'+prodid+'-INLINE-Variety" style="width:20em" multiple="multiple"></select>';
  $('#' + prodid + '-Variety').html(strHTML);
  //getVarietiesForSelect(prodid+'-INLINE-Variety');
  //$('#'+prodid+'-INLINE-Variety').val(globalExistingVariety.split(' '));
  //$('#'+prodid+'-INLINE-Variety').select2({tags: true, tokenSeparators: [' ']});
  strHTML = '<input name="' + prodid + '-INLINE-GI" id="' + prodid + '-INLINE-GI" value="' + globalExistingGI + '" class="validgi" style="width:15em" />';
  //strHTML = '<select name="'+prodid+'-INLINE-GI" id="'+prodid+'-INLINE-GI" style="width:20em"><option value="'+globalExistingGI+'" selected>'+globalExistingGI+'</option></select>';
  $('#' + prodid + '-GI').html(strHTML);
  //getGIsForSelect(prodid+'-INLINE-GI', globalExistingGI);
  //$('#'+prodid+'-INLINE-GI').select2();
  strHTML = '<input name="' + prodid + '-INLINE-Vintage" id="' + prodid + '-INLINE-Vintage" value="' + globalExistingVintage + '" class="validvintage" style="width:5em" />';
  $('#' + prodid + '-Vintage').html(strHTML);
  strHTML = '<input name="' + prodid + '-INLINE-BatchNumber" id="' + prodid + '-INLINE-BatchNumber" value="' + globalExistingBatch + '" class="validbatch" style="width:11em" />';
  $('#' + prodid + '-BatchNumber').html(strHTML);
  strHTML = '<input name="' + prodid + '-INLINE-Quantity" id="' + prodid + '-INLINE-Quantity" value="' + globalExistingQuantity + '" class="validqty cur" style="width:5em" />';
  $('#' + prodid + '-Quantity').html(strHTML);
  strHTML = '$<input name="' + prodid + '-INLINE-Price" id="' + prodid + '-INLINE-Price" value="' + globalExistingPrice + '" class="validprice cur" style="width:5em" />';
  $('#' + prodid + '-Price').html(strHTML);
}

function cancelInlineBulk(prodid) {
  //Show edits
  $('.ebutth').switchClass('ebutth', 'ebutt');
  $('.dbutth').switchClass('dbutth', 'dbutt');
  $('#' + prodid + '-Cancel').switchClass('cbutt', 'cbutth');
  $('#' + prodid + '-Save').switchClass('sbutt', 'sbutth');
  $('#extruderBottom').hide();
  //Existing
  $('#' + prodid + '-Variety').html(globalExistingVariety);
  $('#' + prodid + '-GI').html(globalExistingGI);
  $('#' + prodid + '-Vintage').html(globalExistingVintage);
  $('#' + prodid + '-BatchNumber').html(globalExistingBatch);
  $('#' + prodid + '-Quantity').html(globalExistingQuantity);
  $('#' + prodid + '-Price').html(globalExistingPrice);
  //Hide the add for new product
  if (prodid == 'newproduct') {
    $('#row-newproduct').hide();
  }
  globalEditFields = false;
}

function saveInlineBulk(prodid) {
  //Validate
  if (!$('[name="frmListing"]').valid()) {
    return false;
  }
  //Buttons
  $('.ebutth').switchClass('ebutth', 'ebutt');
  $('.dbutth').switchClass('dbutth', 'dbutt');
  $('#' + prodid + '-Cancel').switchClass('cbutt', 'cbutth');
  $('#' + prodid + '-Save').switchClass('sbutt', 'sbutth');
  $('#extruderBottom').hide();
  var variety = $('#' + prodid + '-INLINE-Variety').val();
  /*var variety = [];
	$('#'+prodid+'-INLINE-Variety :selected').each(function(i, selected){
		variety[i] = $(selected).text();
	});*/
  var prodtype = $('#newproduct-ProductType').html(); //New product Only
  var vintage = $('#' + prodid + '-INLINE-Vintage').val();
  var gi = $('#' + prodid + '-INLINE-GI').val();
  var batch = $('#' + prodid + '-INLINE-BatchNumber').val();
  var quantity = $('#' + prodid + '-INLINE-Quantity').val();
  var price = $('#' + prodid + '-INLINE-Price').val();
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "saveInlineFruitBulkEdit",
      "prodtype": prodtype,
      "prodid": prodid,
      "variety": variety.toLowerCase(), //reset to Lower as back-end will do the same
      "vintage": vintage,
      "gi": gi,
      "batch": batch,
      "quantity": quantity,
      "price": price,
      "nonce": nonce
    },
    success: function(data) {
      if (data.message == 'insufficientpermissions') {
        alert('Sorry, you do not have permission to update this product.');
        cancelInlineBulk(prodid)
      } else {
        $('#' + prodid + '-Variety').html(variety.toLowerCase()); //reset to Lower as back-end will do the same
        $('#' + prodid + '-GI').html(gi);
        $('#' + prodid + '-Vintage').html(vintage);
        $('#' + prodid + '-BatchNumber').html(batch);
        $('#' + prodid + '-Quantity').html(quantity);
        $('#' + prodid + '-Price').html(price);
        $('#' + prodid + '-Variety').removeClass('invaliddata');
        $('#' + prodid + '-GI').removeClass('invaliddata');
        $('#' + prodid + '-Vintage').removeClass('invaliddata');
        $('#' + prodid + '-BatchNumber').removeClass('invaliddata');
        $('#' + prodid + '-Quantity').removeClass('invaliddata');
        $('#' + prodid + '-Price').removeClass('invaliddata');
        if (data.message != '') {
          var invalid = data.message;
          var invalidfields = invalid.split(',');
          var arrayLength = invalidfields.length;
          for (var i = 0; i < arrayLength; i++) {
            $('#' + prodid + '-' + invalidfields[i]).addClass('invaliddata');
          }
        } else {
          setListingUpdatedDisplayDate();
        }
        checkInvalidData();
        globalEditFields = false;
        if (prodid == 'newproduct') {
          self.location.reload();
        }
      }
    },
    failure: function() {
      alert("Sorry, unable to update");
    }
  });
}

function checkInvalidData() {
  if ($('div.invaliddata').length) {
    $('#listinginvalid').show();
  } else {
    $('#listinginvalid').hide();
  }
}

function setListingUpdatedDisplayDate() {
  //Set the display of the updated date
  var fullDate = new Date();
  var twoDigitMonth = fullDate.getMonth() + "";
  if (twoDigitMonth.length == 1)
    twoDigitMonth = "0" + twoDigitMonth;
  var twoDigitDate = fullDate.getDate() + "";
  if (twoDigitDate.length == 1)
    twoDigitDate = "0" + twoDigitDate;
  var currentDate = twoDigitDate + "/" + twoDigitMonth + "/" + fullDate.getFullYear();
  $('#datelistingupdated').html(currentDate + ' - 0 days old');
  $('#datelistingexpire').html('30');
}

function saveBuyNowItem(id, itemnum) {
  var BuyNowQuantity = $('[name=BuyNowQuantity-' + id + ']').val();
  var BuyNowPrice = $('[name=BuyNowPrice-' + id + ']').val();
  var BuyNowShipACTM = $('[name=BuyNowShipACTM-' + id + ']').val();
  var BuyNowShipACTC = $('[name=BuyNowShipACTC-' + id + ']').val();
  var BuyNowShipNSWM = $('[name=BuyNowShipNSWM-' + id + ']').val();
  var BuyNowShipNSWC = $('[name=BuyNowShipNSWC-' + id + ']').val();
  var BuyNowShipNTM = $('[name=BuyNowShipNTM-' + id + ']').val();
  var BuyNowShipNTC = $('[name=BuyNowShipNTC-' + id + ']').val();
  var BuyNowShipQLDM = $('[name=BuyNowShipQLDM-' + id + ']').val();
  var BuyNowShipQLDC = $('[name=BuyNowShipQLDC-' + id + ']').val();
  var BuyNowShipSAM = $('[name=BuyNowShipSAM-' + id + ']').val();
  var BuyNowShipSAC = $('[name=BuyNowShipSAC-' + id + ']').val();
  var BuyNowShipTASM = $('[name=BuyNowShipTASM-' + id + ']').val();
  var BuyNowShipTASC = $('[name=BuyNowShipTASC-' + id + ']').val();
  var BuyNowShipWAM = $('[name=BuyNowShipWAM-' + id + ']').val();
  var BuyNowShipWAC = $('[name=BuyNowShipWAC-' + id + ']').val();
  var BuyNowShipVICM = $('[name=BuyNowShipVICM-' + id + ']').val();
  var BuyNowShipVICC = $('[name=BuyNowShipVICC-' + id + ']').val();
  var BuyNowPaymentTerms = $('[name=BuyNowPaymentTerms-' + id + ']').val();
  //Validate the shipment
  if ($('[name=BuyNowPaymentTerms-'+id + ']').val() == '') {
    alert('Please select the payment terms');
  } else {
    $.ajax({
      url: ajaxurl,
      type: "post",
      dataType: "json",
      cache: false,
      data: {
        "action": "ajax_request",
        "a": "saveBuyNowItem",
        "prodid": id,
        "itemnum": itemnum,
        "BuyNowQuantity": BuyNowQuantity,
        "BuyNowPrice": BuyNowPrice,
        "BuyNowShipACTM": BuyNowShipACTM,
        "BuyNowShipACTC": BuyNowShipACTC,
        "BuyNowShipNSWM": BuyNowShipNSWM,
        "BuyNowShipNSWC": BuyNowShipNSWC,
        "BuyNowShipNTM": BuyNowShipNTM,
        "BuyNowShipNTC": BuyNowShipNTC,
        "BuyNowShipQLDM": BuyNowShipQLDM,
        "BuyNowShipQLDC": BuyNowShipQLDC,
        "BuyNowShipSAM": BuyNowShipSAM,
        "BuyNowShipSAC": BuyNowShipSAC,
        "BuyNowShipTASM": BuyNowShipTASM,
        "BuyNowShipTASC": BuyNowShipTASC,
        "BuyNowShipWAM": BuyNowShipWAM,
        "BuyNowShipWAC": BuyNowShipWAC,
        "BuyNowShipVICM": BuyNowShipVICM,
        "BuyNowShipVICC": BuyNowShipVICC,
        "BuyNowPaymentTerms": BuyNowPaymentTerms,
        "nonce": nonce
      },
      success: function(data) {
        if (data.message == 'insufficientpermissions') {
          alert('Sorry, you do not have permission to update this product.');
        } else {
          if (id == 'new') {
            $('#Reopen').val('reopen');
            $("#dialoginteraction").dialog("open");
          } else {
            $('#submitbuttbuynow-' + id).slideUp();
          }
        }
      },
      failure: function() {
        alert("Sorry, unable to update");
      }
    });
  }
}

function deleteBuyNowItem(id, itemnum) {
  //make AJAX request
  $.ajax({
    url: ajaxurl,
    type: 'post',
    dataType: 'json',
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "deleteBuyNowItem",
      "nonce": nonce,
      "prodid": id,
      "itemnum": itemnum
    },
    beforeSend: function() {},
    success: function(obj) {
      if (obj.response == 'success') {
        // success
        //Hide the row
        $('#buynow-' + id).slideUp('500');
      } else if (obj.response == 'failed') {
        // failed
      }
    }
  });
}

function updateShippingPrice(postcode) {
  var oid = $('#offerid').val();
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "getPostcodeStateMetroCountry",
      "postcode": postcode,
      'oid': oid,
      "nonce": nonce
    },
    success: function(data) {
      if (data.message == 'Insufficient permissions!') {
        alert('Sorry, you need to be logged in.');
      } else {
        $('.shipcol').removeClass('buynowship');
        $('#' + data.state + data.countrymetro).addClass('buynowship');
        $('#FreightFee').val(data.freightfee);
        $('#state_postal').val(data.state);
      }
    },
    failure: function() {
      alert("Sorry, unable to retrive postal region information");
    }
  });
}

function silentMode(postcode) {
	  var silentchk = $('#silentmode').prop('checked');
	  var silent = (silentchk) ? 'silent' : '';
	  $.ajax({
	    url: ajaxurl,
	    type: "post",
	    dataType: "json",
	    cache: false,
	    data: {
	      "action": "ajax_request",
	      "a": "silentMode",
	      "silent": silent,
	      "nonce": nonce
	    },
	    success: function(data) {
	      if (data.message == 'Insufficient permissions!') {
	        alert('Sorry, you need to be logged in.');
	        $('#SilentMode').val('');
	      } else {
	      }
	    },
	    failure: function() {
	      alert("Sorry, unable to switch silent mode");
	    }
	  });
}

function checkLockedDocDescs() {
  var warn = 'There is a locked document with this name, please select or enter a different name.';
  var desc = ($('#filetype').val() === 'Other') ? $('#fileother').val() : $('#filetype').val();
  desc = desc.replace(/\s+/g, '-').toLowerCase().trim();
  if (lockedFileDescriptions.indexOf(desc) !== -1) {
    $('#warnlocked').val(warn);
    $('#warnlock').html(warn);
    $('#filestuff').hide();
    $('#myfile').hide();
    $('#submitBtn').hide();
  } else {
    $('#warnlocked').val('');
    $('#warnlock').html('');
    $('#filestuff').show();
    $('#myfile').show();
    $('#submitBtn').show();
  }
}

function listContractFileAttachments(contractID, perspective) {
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "listContractFileAttachments",
      "nonce": nonce,
      "contractID": contractID,
      "perspective": perspective
    },
    success: function(obj) {
      if (obj.response == 'success') {
        //success
        var html = obj.html;
        //Write any htmlinfo to the dialog box
        $('#listfileattachments').html(html);
      }
    },
    failure: function() {
      console.log('Unable to list the file attachments')
    }
  });
}

function checkFileType() {
  //File uploads on the Contract
  if ($('#filetype').val() === 'Other') {
    $('#otherfiledesc').slideDown('slow');
  } else {
    $('#otherfiledesc').slideUp('slow');
  }
  //Check desc for locked files
  checkLockedDocDescs()
}
