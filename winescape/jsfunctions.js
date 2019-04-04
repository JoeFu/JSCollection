/*
 * Here's the list of tokens supported: m (or M) : month number, one or two
 * digits. mm (or MM) : month number, strictly two digits (i.e. April is 04). d
 * (or D) : day number, one or two digits. dd (or DD) : day number, strictly two
 * digits. y (or Y) : year, two or four digits. yy (or YY) : year, strictly two
 * digits. yyyy (or YYYY) : year, strictly four digits. mon : abbreviated month
 * name (April is apr, Apr, APR, etc.) Mon : abbreviated month name, mixed-case
 * (i.e. April is Apr only). MON : abbreviated month name, all upper-case (i.e.
 * April is APR only). mon_strict : abbreviated month name, all lower-case (i.e.
 * April is apr only). month : full month name (April is april, April, APRIL,
 * etc.) Month : full month name, mixed-case (i.e. April only). MONTH: full
 * month name, all upper-case (i.e. APRIL only). month_strict : full month name,
 * all lower-case (i.e. april only). h (or H) : hour, one or two digits. hh (or
 * HH) : hour, strictly two digits. min (or MIN): minutes, one or two digits.
 * mins (or MINS) : minutes, strictly two digits. s (or S) : seconds, one or two
 * digits. ss (or SS) : seconds, strictly two digits. ampm (or AMPM) : am/pm
 * setting. Valid values to match this token are am, pm, AM, PM, a.m., p.m.,
 * A.M., P.M.
 */
//Be careful with this pattern. Longer tokens should be placed before shorter
//tokens to disambiguate them. For example, parsing "mon_strict" should
//result in one token "mon_strict" and not two tokens "mon" and a literal
//"_strict".

var tokPat=new RegExp("^month_strict|month|Month|MONTH|yyyy|YYYY|mins|MINS|mon_strict|ampm|AMPM|mon|Mon|MON|min|MIN|dd|DD|mm|MM|yy|YY|hh|HH|ss|SS|m|M|d|D|y|Y|h|H|s|S");

//lowerMonArr is used to map months to their numeric values.

var lowerMonArr={jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12};

//monPatArr contains regular expressions used for matching abbreviated months
//in a date string.

var monPatArr=new Array();
monPatArr['mon_strict']=new RegExp(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/);
monPatArr['Mon']=new RegExp(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
monPatArr['MON']=new RegExp(/JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC/);
monPatArr['mon']=new RegExp("jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec",'i');

//monthPatArr contains regular expressions used for matching full months
//in a date string.

var monthPatArr=new Array();
monthPatArr['month']=new RegExp(/^january|february|march|april|may|june|july|august|september|october|november|december/i);
monthPatArr['Month']=new RegExp(/^January|February|March|April|May|June|July|August|September|October|November|December/);
monthPatArr['MONTH']=new RegExp(/^JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER/);
monthPatArr['month_strict']=new RegExp(/^january|february|march|april|may|june|july|august|september|october|november|december/);

//cutoffYear is the cut-off for assigning "19" or "20" as century. Any
//two-digit year >= cutoffYear will get a century of "19", and everything
//else gets a century of "20".

var cutoffYear=50;

//FormatToken is a datatype we use for storing extracted tokens from the
//format string.

function FormatToken (token, type) {
	this.token=token;
	this.type=type;
}

function parseFormatString (formatStr) {
	var tokArr=new Array;
	var tokInd=0;
	var strInd=0;
	var foundTok=0;

	while (strInd < formatStr.length) {
		if (formatStr.charAt(strInd)=="%" &&
				(matchArray=formatStr.substr(strInd+1).match(tokPat)) != null) {
			strInd+=matchArray[0].length+1;
			tokArr[tokInd++]=new FormatToken(matchArray[0],"symbolic");
		} else {

//			No token matched current position, so current character should
//			be saved as a required literal.

			if (tokInd>0 && tokArr[tokInd-1].type=="literal") {

//				Literal tokens can be combined.Just add to the last token.

				tokArr[tokInd-1].token+=formatStr.charAt(strInd++);
			}
			else {
				tokArr[tokInd++]=new FormatToken(formatStr.charAt(strInd++), "literal");
			}
		}
	}
	return tokArr;
}

/*
 * buildDate does all the real work.It takes a date string and format string,
 * tries to match the two up, and returns a Date object (with the supplied date
 * string value).If a date string doesn't contain all the fields that a Date
 * object contains (for example, a date string with just the month), all
 * unprovided fields are defaulted to those characteristics of the current date.
 * Time fields that aren't provided default to 0.Thus, a date string like
 * "3/30/2000" in "%mm/%dd/%yyyy" format results in a Date object for that date
 * at midnight.formatStr is a free-form string that indicates special tokens via
 * the % character.Here are some examples that will return a Date object:
 *
 * buildDate('3/30/2000','%mm/%dd/%y') // March 30, 2000 buildDate('March 30,
 * 2000','%Mon %d, %y') // Same as above. buildDate('Here is the date:
 * 30-3-00','Here is the date: %dd-%m-%yy')
 *
 * If the format string does not match the string provided, an error message
 * (i.e. String object) is returned.Thus, to see if buildDate succeeded, the
 * caller can use the "typeof" command on the return value.For example, here's
 * the dateCheck function, which returns true if a given date is valid,and false
 * otherwise (and reports an error in the false case):
 *
 * function dateCheck(dateStr,formatStr) { var
 * myObj=buildDate(dateStr,formatStr); if (typeof myObj=="object") { // We got a
 * Date object, so good. return true; } else { // We got an error string.
 * alert(myObj); return false; } }
 *
 */

function buildDate(dateStr,formatStr) {
//	parse the format string first.
	var tokArr=parseFormatString(formatStr);
	var strInd=0;
	var tokInd=0;
	var intMonth;
	var intDay;
	var intYear;
	var intHour;
	var intMin;
	var intSec;
	var ampm="";
	var strOffset;

//	Create a date object with the current date so that if the user only
//	gives a month or day string, we can still return a valid date.

	var curdate=new Date();
	intMonth=curdate.getMonth()+1;
	intDay=curdate.getDate();
	intYear=curdate.getFullYear();

//	Default time to midnight, so that if given just date info, we return
//	a Date object for that date at midnight.

	intHour=0;
	intMin=0;
	intSec=0;

//	Walk across dateStr, matching the parsed formatStr until we find a
//	mismatch or succeed.

	while (strInd < dateStr.length && tokInd < tokArr.length) {

//		Start with the easy case of matching a literal.

		if (tokArr[tokInd].type=="literal") {
			if (dateStr.indexOf(tokArr[tokInd].token,strInd)==strInd) {

//				The current position in the string does match the format
//				pattern.

				strInd+=tokArr[tokInd++].token.length;
				continue;
			}
			else {

//				ACK! There was a mismatch; return error.

				return "\"" + dateStr + "\" does not conform to the expected format: " + formatStr;
			}
		}

//		If we get here, we're matching to a symbolic token.
		switch (tokArr[tokInd].token) {
		case 'm':
		case 'M':
		case 'd':
		case 'D':
		case 'h':
		case 'H':
		case 'min':
		case 'MIN':
		case 's':
		case 'S':

//			Extract one or two characters from the date-time string and if
//			it's a number, save it as the month, day, hour, or minute, as
//			appropriate.

			curChar=dateStr.charAt(strInd);
			nextChar=dateStr.charAt(strInd+1);
			matchArr=dateStr.substr(strInd).match(/^\d{1,2}/);
			if (matchArr==null) {

//				First character isn't a number; there's a mismatch between
//				the pattern and date string, so return error.

				switch (tokArr[tokInd].token.toLowerCase()) {
				case 'd': var unit="day"; break;
				case 'm': var unit="month"; break;
				case 'h': var unit="hour"; break;
				case 'min': var unit="minute"; break;
				case 's': var unit="second"; break;
				}
				return "Bad " + unit + " \"" + curChar + "\" or \"" + curChar +
				nextChar + "\".";
			}
			strOffset=matchArr[0].length;
			switch (tokArr[tokInd].token.toLowerCase()) {
			case 'd': intDay=parseInt(matchArr[0],10); break;
			case 'm': intMonth=parseInt(matchArr[0],10); break;
			case 'h': intHour=parseInt(matchArr[0],10); break;
			case 'min': intMin=parseInt(matchArr[0],10); break;
			case 's': intSec=parseInt(matchArr[0],10); break;
			}
			break;
		case 'mm':
		case 'MM':
		case 'dd':
		case 'DD':
		case 'hh':
		case 'HH':
		case 'mins':
		case 'MINS':
		case 'ss':
		case 'SS':

//			Extract two characters from the date string and if it's a
//			number, save it as the month, day, or hour, as appropriate.

			strOffset=2;
			matchArr=dateStr.substr(strInd).match(/^\d{2}/);
			if (matchArr==null) {

//				The two characters aren't a number; there's a mismatch
//				between the pattern and date string, so return an error
//				message.

				switch (tokArr[tokInd].token.toLowerCase()) {
				case 'dd': var unit="day"; break;
				case 'mm': var unit="month"; break;
				case 'hh': var unit="hour"; break;
				case 'mins': var unit="minute"; break;
				case 'ss': var unit="second"; break;
				}
				return "Bad " + unit + " \"" + dateStr.substr(strInd,2) +
				"\".";
			}
			switch (tokArr[tokInd].token.toLowerCase()) {
			case 'dd': intDay=parseInt(matchArr[0],10); break;
			case 'mm': intMonth=parseInt(matchArr[0],10); break;
			case 'hh': intHour=parseInt(matchArr[0],10); break;
			case 'mins': intMin=parseInt(matchArr[0],10); break;
			case 'ss': intSec=parseInt(matchArr[0],10); break;
			}
			break;
		case 'y':
		case 'Y':

//			Extract two or four characters from the date string and if it's
//			a number, save it as the year.Convert two-digit years to four
//			digit years by assigning a century of '19' if the year is >=
//			cutoffYear, and '20' otherwise.

			if (dateStr.substr(strInd,4).search(/\d{4}/) != -1) {

//				Four digit year.

				intYear=parseInt(dateStr.substr(strInd,4),10);
				strOffset=4;
			}
			else {
				if (dateStr.substr(strInd,2).search(/\d{2}/) != -1) {

//					Two digit year.

					intYear=parseInt(dateStr.substr(strInd,2),10);
					if (intYear>=cutoffYear) {
						intYear+=1900;
					}
					else {
						intYear+=2000;
					}
					strOffset=2;
				}
				else {

//					Bad year; return error.

					return "Bad year \"" + dateStr.substr(strInd,2) +
					"\". Must be two or four digits.";
				}
			}
			break;
		case 'yy':
		case 'YY':

//			Extract two characters from the date string and if it's a
//			number, save it as the year.Convert two-digit years to four
//			digit years by assigning a century of '19' if the year is >=
//			cutoffYear, and '20' otherwise.

			if (dateStr.substr(strInd,2).search(/\d{2}/) != -1) {

//				Two digit year.

				intYear=parseInt(dateStr.substr(strInd,2),10);
				if (intYear>=cutoffYear) {
					intYear+=1900;
				}
				else {
					intYear+=2000;
				}
				strOffset=2;
			} else {
//				Bad year; return error
				return "Bad year \"" + dateStr.substr(strInd,2) +
				"\". Must be two digits.";
			}
			break;
		case 'yyyy':
		case 'YYYY':

//			Extract four characters from the date string and if it's a
//			number, save it as the year.

			if (dateStr.substr(strInd,4).search(/\d{4}/) != -1) {

//				Four digit year.

				intYear=parseInt(dateStr.substr(strInd,4),10);
				strOffset=4;
			}
			else {

//				Bad year; return error.

				return "Bad year \"" + dateStr.substr(strInd,4) +
				"\". Must be four digits.";
			}
			break;
		case 'mon':
		case 'Mon':
		case 'MON':
		case 'mon_strict':

//			Extract three characters from dateStr and parse them as
//			lower-case, mixed-case, or upper-case abbreviated months,
//			as appropriate.

			monPat=monPatArr[tokArr[tokInd].token];
			if (dateStr.substr(strInd,3).search(monPat) != -1) {
				intMonth=lowerMonArr[dateStr.substr(strInd,3).toLowerCase()];
			}
			else {

//				Bad month, return error.

				switch (tokArr[tokInd].token) {
				case 'mon_strict': caseStat="lower-case"; break;
				case 'Mon': caseStat="mixed-case"; break;
				case 'MON': caseStat="upper-case"; break;
				case 'mon': caseStat="between Jan and Dec"; break;
				}
				return "Bad month \"" + dateStr.substr(strInd,3) +
				"\". Must be " + caseStat + ".";
			}
			strOffset=3;
			break;
		case 'month':
		case 'Month':
		case 'MONTH':
		case 'month_strict':

//			Extract a full month name at strInd from dateStr if possible.

			monPat=monthPatArr[tokArr[tokInd].token];
			matchArray=dateStr.substr(strInd).match(monPat);
			if (matchArray==null) {

//				Bad month, return error.

				return "Can't find a month beginning at \"" +
				dateStr.substr(strInd) + "\".";
			}

//			It's a good month.

			intMonth=lowerMonArr[matchArray[0].substr(0,3).toLowerCase()];
			strOffset=matchArray[0].length;
			break;
		case 'ampm':
		case 'AMPM':
			matchArr=dateStr.substr(strInd).match(/^(am|pm|AM|PM|a\.m\.|p\.m\.|A\.M\.|P\.M\.)/);
			if (matchArr==null) {

//				There's no am/pm in the string.Return error msg.

				return "Missing am/pm designation.";
			}

//			Store am/pm value for later (as just am or pm, to make things
//			easier later).

			if (matchArr[0].substr(0,1).toLowerCase() == "a") {

//				This is am.

				ampm = "am";
			}
			else {
				ampm = "pm";
			}
			strOffset = matchArr[0].length;
			break;
		}
		strInd += strOffset;
		tokInd++;
	}
	if (tokInd != tokArr.length || strInd != dateStr.length) {

		/*
		 * We got through the whole date string or format string, but there's more data
		 * in the other, so there's a mismatch.
		 */

		return "\"" + dateStr + "\" incorrect date value. format should be: " + formatStr;
	}

//	Make sure all components are in the right ranges.

	if (intMonth < 1 || intMonth > 12) {
		return "Month must be between 1 and 12.";
	}
	if (intDay < 1 || intDay > 31) {
		return "Day must be between 1 and 31.";
	}

//	Make sure user doesn't put 31 for a month that only has 30 days

	if ((intMonth == 4 || intMonth == 6 || intMonth == 9 || intMonth == 11) && intDay == 31) {
		return "Month "+intMonth+" doesn't have 31 days!";
	}

//	Check for February date validity (including leap years)

	if (intMonth == 2) {

//		figure out if "year" is a leap year; don't forget that
//		century years are only leap years if divisible by 400

		var isleap=(intYear%4==0 && (intYear%100!=0 || intYear%400==0));
		if (intDay > 29 || (intDay == 29 && !isleap)) {
			return "February " + intYear + " doesn't have " + intDay +
			" days!";
		}
	}

//	Check that if am/pm is not provided, hours are between 0 and 23.

	if (ampm == "") {
		if (intHour < 0 || intHour > 23) {
			return "Hour must be between 0 and 23 for military time.";
		}
	}
	else {

//		non-military time, so make sure it's between 1 and 12.

		if (intHour < 1|| intHour > 12) {
			return "Hour must be between 1 and 12 for standard time.";
		}
	}

//	If user specified amor pm, convert intHour to military.

	if (ampm=="am" && intHour==12) {
		intHour=0;
	}
	if (ampm=="pm" && intHour < 12) {
		intHour += 12;
	}
	if (intMin < 0 || intMin > 59) {
		return "Minute must be between 0 and 59.";
	}
	if (intSec < 0 || intSec > 59) {
		return "Second must be between 0 and 59.";
	}
	return new Date(intYear,intMonth-1,intDay,intHour,intMin,intSec);
}
function dateCheck(dateStr,formatStr) {
	var myObj = buildDate(dateStr,formatStr);
	if (typeof myObj == "object") {

//		We got a Date object, so good.

		return true;
	}
	else {

//		We got an error string.

		alert(myObj);
		return false;
	}
}
//End -->


function submitonEnter(evt, frm){
	if (window.event) { //IE
		var charCode = event.keyCode;
	} else {
		var charCode = evt.which;
	}
	if(charCode == '13'){
		document.forms[frm].submit();
	}
}
function validateText(field, descField) {
	if (field.value == "") {
		alert ("Please complete the " + descField + " field.");
		field.focus();
		return (false);
	}
	return (true);
}

function validateTextValue(thevalue, descField) {
	if (thevalue == "") {
		alert ("Please complete the " + descField + " field.");
		return (false);
	}
	return (true);
}

function validateSingleChkbox(field, descField) {
	if (!field.checked) {
		alert ("Please complete the " + descField + ".");
		field.focus();
		return (false);
	}
	return (true);
}

function validateChkbox(field, descField) {
	var valid;
	valid = false;
	for (var i = 0; i < field.length; i++) {
		if (field[i].checked){
			valid = true;
		}
	}
	if (!valid) {
		alert ("Please complete the " + descField + ".");
		field[0].focus();
		return (false);
	}
	return (true);
}

function validateCombo(field, descField) {
	with(field) {
		if (options[selectedIndex].text == "") {
		alert ("Please complete the " + descField + " field.");
		field.focus();
		return (false);
		}
		return (true);
	}
}

function validateNumber(field, descField) {
	with(field) {
		var re = /,/g;
		var tmpNum = parseFloat(field.value.replace(re,""));
		if (Number(tmpNum) != tmpNum) {
			alert ("Please enter a valid number for the " + descField + " field.");
			field.focus();
			return (false);
		}
		return (true);
	}
}

function validateNumValue(thevalue, descField) {
	var re = /,/g;
	var tmpNum = parseFloat(thevalue.replace(re,""));
	if (Number(tmpNum) != tmpNum) {
		alert ("Please enter a valid number for the " + descField + " field.");
		return (false);
	}
	return (true);
}

function isFloat(s,allowCommas) {
        var result;
        var re = /,/g;
        if(typeof(allowCommas)=='undefined') { var allowCommas = false; }

        if (allowCommas) {
                result = s != "" && parseFloat(s.replace(re,"")) == s.replace(re,"");
        }
        else {
                result = s != "" && parseFloat(s) == s;
        }
        return result;
}


function isValidObject(objToTest) {
	if (null == objToTest) {
		return false;
	}
	if ("undefined" == typeof(objToTest) ) {
		return false;
	}
	return true;
}


//Left equivalents
function strLeft(sourceStr, keyStr){
	return (sourceStr.indexOf(keyStr) == -1 | keyStr=='') ? '' : sourceStr.split(keyStr)[0];
}

function nLeft(str, n){
if (n <= 0)     // Invalid bound, return blank string
	return "";
else if (n > String(str).length)   // Invalid bound, return
	return str;  // entire string
else // Valid bound, return appropriate substring
	return String(str).substring(0,n);
}

//Right equivalents
function strRight(sourceStr, keyStr){
idx = sourceStr.indexOf(keyStr);
return (idx == -1 | keyStr=='') ? '' : sourceStr.substr(idx+ keyStr.length);
}
function nRight(str, n){
if (n <= 0)     // Invalid bound, return blank string
	return "";
else if (n > String(str).length)   // Invalid bound, return
	return str;  // entire string
else { // Valid bound, return appropriate substring
	var iLen = String(str).length;
return String(str).substring(iLen, iLen - n);}
}

//RightBack equivalent
function rightBack(sourceStr, keyStr){
arr = sourceStr.split(keyStr);
return (sourceStr.indexOf(keyStr) == -1 | keyStr=='') ? '' : arr.pop();
}

//LeftBack equivalent
function leftBack(sourceStr, keyStr){
arr = sourceStr.split(keyStr);
arr.pop();
return (keyStr==null | keyStr=='') ? '' : arr.join(keyStr);
}

//Middle equivalent
function middle(sourceStr, keyStrLeft, keyStrRight){
return strLeft(strRight(sourceStr,keyStrLeft), keyStrRight);
}

function isArray(obj) {
   if (obj.constructor.toString().indexOf("Array") == -1)
      return false;
   else
      return true;
}
function arrayUnique(a){
   var r = new Array();
   o:for(var i = 0, n = a.length; i < n; i++) {
      for(var x = i + 1 ; x < n; x++)
      {
         if(a[x]==a[i]) continue o;
      }
      r[r.length] = a[i];
   }
   return r;
}
function cleanArray(actual){
  var newArray = new Array();
  for(var i = 0; i<actual.length; i++){
      if (actual[i]){
        newArray.push(actual[i]);
    }
  }
  return newArray;
}

function rowHighlight(objectThis, strClass) {
	objectThis.className=strClass;
}

function checkEmailAddress(field){
	var x = field.value;
	var filter  = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	if (filter.test(x)){
		return(true);
	} else {
		alert('Incorrect email address format');
		field.focus();
		return(false);
	}
}

//Registration validation
function submitRegistration() {
	with (document.forms['winescape-reg']){
		if (!validateText(fname, 'first name')) return(false);
		if (!validateText(lname, 'last name')) return(false);
		if (!validateText(email, 'email')) return(false);
		if (!checkEmailAddress(email)) return(false);
		if (!validateText(phone, 'phone')) return(false);
		if (!validateText(company, 'company')) return(false);
		if (!validateText(address_postal, 'postal address')) return(false);
		if (!validateText(state_postal, 'postal state')) return(false);
		if (!validateText(postcode_postal, 'postal postcodel')) return(false);
		if (!validateText(country_postal, 'postal country')) return(false);
		if (!validateText(username, 'username')) return(false);
		if (!validateSingleChkbox(terms, 'terms & conditions')) return(false);
		return true;
	}
}

function switchIdentity(id) {
	strPath = strLeft(self.location.href, '?');
	if (strPath==''){
		strPath = self.location.href;
	}
	self.location.href = strPath + '?identity=' + id;
}

function switchSupplier(id) {
	strPath = strLeft(self.location.href, '?');
	if (strPath==''){
		strPath = self.location.href;
	}
	self.location.href = strPath + '?supplierid=' + id;
}
function switchBuyer(id) {
	strPath = strLeft(self.location.href, '?');
	if (strPath==''){
		strPath = self.location.href;
	}
	self.location.href = strPath + '?buyerid=' + id;
}

function startUpload(){
    document.getElementById('f1_upload_process').style.display = 'block';
    document.getElementById('f1_upload_form').style.display = 'none';
    return true;
}
function stopUpload(success, supplierid, prodtype){
    var result = '';
    if (success == 1){
       result = '<span class="msg">Please wait while the file is processed . . .<\/span><br/><br/>';
    }
    else {
       result = '<span class="emsg">There was an error during file upload!<\/span><br/>Only Excel files (.xls or .xlsx) are permitted. Max file size 350KB.<br/>';
    }
    document.getElementById('f1_upload_process').style.display = 'none';
    document.getElementById('f1_upload_form').innerHTML = result + '<label>File: <input name="myfile" type="file" size="30" /><\/label><label><input type="submit" name="submitBtn" class="sbtn" value="Upload" /><\/label>';
    document.getElementById('f1_upload_form').style.display = 'block';
    processUpload(supplierid);
    return true;
}
function processUpload(supplierid){
	strPath = strLeft(self.location.href, '?');
	if (strPath==''){
		strPath = self.location.href;
	}
	self.location.href = strPath + '?supplierid=' + supplierid + '&action=processupload';
}
function startFileUpload(){
	if ($('#filetype').val() === '') {
		alert('Please select the document type');
		$('#filetype').focus();
		return false;
	}
	if ($('#filetype').val() === 'Other' && $('#fileother').val() === '') {
		alert('Please enter a description for the file');
		$('#fileother').focus()
		return false;
	}
	if ($("input[name='doclock']:checked").length < 1) {
		alert('Please select whether this document is locked or unlocked');
		$("input[name='doclock']").focus();
		return false;
	}
	if ($('#myfile').val() === '') {
		alert('Please select the pdf file to upload');
		return false;
	}
  document.getElementById('f1_upload_process').style.display = 'block';
  document.getElementById('f1_upload_form').style.display = 'none';
  return true;
}
function stopFileUpload(fileDetails){
  var result = '';
  if (fileDetails.result == 1){
     result = '<span class="msg">Please wait while the file is processed . . .<\/span><br/><br/>';
  } else {
     result = '<span class="emsg">There was an error during file upload!<\/span><br/>Only PDF files (.pdf) are permitted. Max file size 2MB.<br/>';
		 document.getElementById('f1_upload_process').style.display = 'none';
		 document.getElementById('f1_upload_form').innerHTML = result
		 document.getElementById('f1_upload_form').style.display = 'block';
		 return false;
  }
  document.getElementById('f1_upload_process').style.display = 'none';
  document.getElementById('f1_upload_form').innerHTML = result + '<label>File: <input name="myfile" type="file" size="30" /><\/label><label><input type="submit" name="submitBtn" class="sbtn" value="Upload" /><\/label>';
  document.getElementById('f1_upload_form').style.display = 'block';
  processFileUpload(fileDetails);
  return true;
}
function processFileUpload(fileDetails){
	strPath = strLeft(self.location.href, '?');
	if (strPath==''){
		strPath = self.location.href;
	}
  $.ajax({
    url: ajaxurl,
    type: "post",
    dataType: "json",
    cache: false,
    data: {
      "action": "ajax_request",
      "a": "updateFileUploadedDetails",
			"result": fileDetails.result,
			"userid": fileDetails.userid,
			"contractid": fileDetails.contractid,
			"samplenum": fileDetails.samplenum,
			"filetype": fileDetails.filetype,
			"doclock": fileDetails.doclock,
			"docmessage": fileDetails.docmessage,
			"perspective": fileDetails.perspective,
			"urlparams": fileDetails.urlparams,
      "nonce": nonce
    },
    success: function(data) {
      if (data.message == 'Insufficient permissions!') {
        alert('Sorry, you need to be logged in.');
      } else {
        //self.location.href = strPath + '?' + fileDetails.urlparams;
				listAttachments();
      }
    },
    failure: function() {
      alert("Sorry, unable to save the file");
    }
  });
}

function popUpWindow(htmfile) {
	popUpWin = window.open(htmfile,'popupWin','height=600,width=800,toolbar=0,location=0, directories=0,status=0,menubar=0,scrollbars=yes,resizable=yes');
	if (navigator.appName == 'Netscape')
	 {
		popUpWin.focus();
	  }
 }

function searchProds(strURL){
	$('#cleanfilters').click();
	self.location.href = strURL + '/?country=' + $('#country').val()
	 + '&state=' + $('#state').val() + '&zone=' + $('#zone').val()
   + '&region=' + $('#region').val() + '&subregion=' + $('#subregion').val()
	 + '&pricemin=' + $('#pricemin').val() + '&pricemax='
   + $('#pricemax').val() + '&variety=' + $('#variety').val()
	 + '&vintage=' + $('#vintage').val()
	 + '&item=' + $('#itemsearch').val()
	 + '&buynow=' + $('#buynowsearch').prop('checked');
}

function setTenderUnit(){
	if ($('#ProductType').val() == 'Cleanskin Wine'){
		$('#Unit').val('Case');
	} else if ($('#ProductType').val() == 'Fruit') {
		$('#Unit').val('Tonnes');
	} else {
		$('#Unit').val('Litre');
	}
}

Number.prototype.formatMoney = function(c, d, t){
	var n = this, c = isNaN(c = Math.abs(c)) ? 2 : c, d = d == undefined ? "," : d, t = t == undefined ? "." : t, s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
	   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
	 };

function resetIndices(){
	$("#isnapdate")[0].selectedIndex = 0;
	$("#iprodtype")[0].selectedIndex = 1;
	$("#ivintage")[0].selectedIndex = 0;
	$("#country")[0].selectedIndex = 0;
	$("#state")[0].selectedIndex = 0;
	$("#zone")[0].selectedIndex = 0;
	$("#region")[0].selectedIndex = 0;
	$("#subregion")[0].selectedIndex = 0;
	updateIndices();
}

function resetTrends(){
	$("#iprodtype")[0].selectedIndex = 1;
	$("#ivariety")[0].selectedIndex = 0;
	$("#ivintage")[0].selectedIndex = 0;
	$("#country")[0].selectedIndex = 0;
	$("#state")[0].selectedIndex = 0;
	$("#zone")[0].selectedIndex = 0;
	$("#region")[0].selectedIndex = 0;
	$("#subregion")[0].selectedIndex = 0;
	updateIndices();
}

function yaxisCurrency(val, axis) {
    return '$' + val.formatMoney(0, '.', ',');
}

function yaxisVolume(val, axis) {
    return val.formatMoney(0, '.', ',') + ' ';
}

function createTooltip() {
  $('<div id="tooltip"></div>').css({
    position: 'absolute',
    display: 'none',
    border: '1px solid #fdd',
    padding: '2px',
    'background-color': '#fee',
    opacity: 0.80
  }).appendTo("body");
}

function showTooltip(x, y, contents) {
  $("#tooltip")
    .html(contents)
    .css({top: y+5, left: x+5})
    .fadeIn(200);
}

function hideTooltip() {
  $("#tooltip").fadeOut(200);
}

function showPrice(event, pos, item) {
	if (item) {
		strValue = item.datapoint[1].formatMoney(2, '.', ',');
		if (item.seriesIndex > 0) {
			strValue = '$' + strValue;
		}
		showTooltip(item.pageX, item.pageY, strValue );
	}
}


function showMapBuying(
		prodType,
		displayShows,
		countShortlist,
		countTenders,
		countTenderArchive,
		countSampleCart,
		countReqSent,
		countInTransit,
		countReceived,
		countUnderOffer,
		actioncountUnderOffer,
		countToDeliver,
		actioncountToDeliver,
		countSampleArchive,
		countOfferArchive,
		countaccepted,
		countfruitreqacc,
		countFruitReqAccepted,
		countFruitUnderOffer,
		actioncountFruitUnderOffer,
		countFruitToDeliv,
		actioncountFruitToDeliv,
		countFruitArchive,
		countFruitOfferArchive,
		countFruitDelivered,
		countDelivered,
		totalFruit,
		totalBulk,
		totalBottled,
		pageStatus
		) {

	//Product Type
	if (prodType == 'Bulk Wine') {
		var prodt = 'Bulk';
	} else if (prodType == 'Bottled Wine') {
		var prodt = 'Bottled';
	} else {
		var prodt = prodType;
	}

	//Set up hover attributes
    var hoverInB = function() {
        this.attr({"fill":"#CFD4C7", "stroke-width": 2});
    };
    var hoverOutB = function() {
        this.attr({"fill":"90-#b8c2ac-#fff", "stroke-width": 1});
    };
    var hoverInBT = function() {
        this.attr({"fill":"#ECDBC6", "stroke-width": 2});
    };
    var hoverOutBT = function() {
        this.attr({"fill":"90-#e8c9a8-#fff", "stroke-width": 1});
    };
    var hoverOutBTA = function() {
        this.attr({"fill":"90-#EDD4BA-#ddd", "stroke-width": 1});
    };
    var hoverOutBSA = function() {
        this.attr({"fill":"90-#CAD2C1-#ddd", "stroke-width": 1});
    };
    var hoverInR = function() {
        this.attr({"stroke-width": 2});
    };
    var hoverOutR = function() {
        this.attr({"stroke-width": 1});
    };
    var hoverSelect = function(ob) {
        ob.attr({"fill":"#666", "stroke-width": 2});
    };
    var hoverDeselect = function(ob) {
        ob.attr({"fill":"#EDEDED", "stroke-width": 1});
    };
		var hoverInBN = function() {
				this.attr({"fill":"90-#e39c32-#fff", "stroke-width": 2});
		};
		var hoverOutBN = function() {
				this.attr({"fill":"90-#F7C62D-#fff", "stroke-width": 1});
		};


    function mapEnterWineMarket() {
    }
    mapEnterWineMarket.prototype.showMap = function(){
		//Enter Markets
		var em = paper.rect(5, 35, 290, 360, 5);
		em.attr({"stroke-width":2, "stroke":"#fff"});
		var emlabeltext = paper.text(150, 60, "Enter Bulk Market");
		emlabeltext.attr({"fill":"#6f3842", "font-size": 18, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		//Bulk Wine
		var bwinemarket = paper.rect(40, 135, 110, 110, 5);
		bwinemarket.attr({"fill":"90-#b8c2ac-#fff", cursor: "pointer", "stroke-width":1, "stroke":"#999"});
		bwinemarket.hover(hoverInB, hoverOutB, bwinemarket, bwinemarket);
		bwinemarket.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/bulk-wine-market/";});
		var bwinemarkettext = paper.text(95, 180, "Bulk\nMarket");
		bwinemarkettext.attr({"fill":"#3c3831", cursor: "pointer", "font-size": 16, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		bwinemarkettext.hover(hoverInB, hoverOutB, bwinemarket, bwinemarket);
		bwinemarkettext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/bulk-wine-market/";});
		var emlabelavailtext = paper.text(95, 215, "("+totalBulk+")");
		emlabelavailtext.attr({"fill":"#6f3842", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });

		//Shows
		if (displayShows == "Show") {
			var swinemarket = paper.rect(180, 155, 70, 70, 5);
			swinemarket.attr({"fill":"90-#b8c2ac-#fff", cursor: "pointer", "stroke-width":1, "stroke":"#999"});
			swinemarket.hover(hoverInB, hoverOutB, swinemarket, swinemarket);
			swinemarket.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/show-winescape/";});
			var swinemarkettext = paper.text(215, 190, "Shows");
			swinemarkettext.attr({"fill":"#3c3831", cursor: "pointer", "font-size": 13, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			swinemarkettext.hover(hoverInB, hoverOutB, swinemarket, swinemarket);
			swinemarkettext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/show-winescape/";});
		}
    };

    function mapEnterFruitMarket() {
    }
    mapEnterFruitMarket.prototype.showMap = function(){
		//Enter Fruit Market
		var em = paper.rect(5, 35, 290, 360, 5);
		em.attr({"stroke-width":2, "stroke":"#fff"});
		var emlabeltext = paper.text(150, 60, "Enter Fruit Market");
		emlabeltext.attr({"fill":"#6f3842", "font-size": 18, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		//Fruit
		var fruitmarket = paper.rect(40, 135, 110, 110, 5);
		fruitmarket.attr({"fill":"90-#b8c2ac-#fff", cursor: "pointer", "stroke-width":1, "stroke":"#999"});
		fruitmarket.hover(hoverInB, hoverOutB, fruitmarket, fruitmarket);
		fruitmarket.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/fruit/";});
		var fruitmarkettext = paper.text(95, 180, "Fruit\nMarket");
		fruitmarkettext.attr({"fill":"#3c3831", cursor: "pointer", "font-size": 16, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		fruitmarkettext.hover(hoverInB, hoverOutB, fruitmarket, fruitmarket);
		fruitmarkettext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/fruit/";});
		var emlabelavailtext = paper.text(95, 215, "("+totalFruit+")");
		emlabelavailtext.attr({"fill":"#6f3842", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		//Shows
		if (displayShows == "Show") {
			var swinemarket = paper.rect(180, 155, 70, 70, 5);
			swinemarket.attr({"fill":"90-#b8c2ac-#fff", cursor: "pointer", "stroke-width":1, "stroke":"#999"});
			swinemarket.hover(hoverInB, hoverOutB, swinemarket, swinemarket);
			swinemarket.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/show-winescape/";});
			var swinemarkettext = paper.text(215, 190, "Shows");
			swinemarkettext.attr({"fill":"#3c3831", cursor: "pointer", "font-size": 13, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			swinemarkettext.hover(hoverInB, hoverOutB, swinemarket, swinemarket);
			swinemarkettext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/show-winescape/";});
		}
    };

    function mapEnterBottledMarket() {
    }
    mapEnterBottledMarket.prototype.showMap = function(){
		//Enter Markets
		var em = paper.rect(5, 35, 290, 360, 5);
		em.attr({"stroke-width":2, "stroke":"#fff"});
		var emlabeltext = paper.text(150, 60, "Enter Bottled Market");
		emlabeltext.attr({"fill":"#6f3842", "font-size": 18, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		//Bottled Wine
		var cwinemarket = paper.rect(40, 135, 110, 110, 5);
		cwinemarket.attr({"fill":"90-#b8c2ac-#fff", cursor: "pointer", "stroke-width":1, "stroke":"#999"});
		cwinemarket.hover(hoverInB, hoverOutB, cwinemarket, cwinemarket);
		cwinemarket.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/bottled-wine/";});
		var cwinemarkettext = paper.text(95, 180, "Bottled\nMarket");
		cwinemarkettext.attr({"fill":"#3c3831", cursor: "pointer", "font-size": 16, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		cwinemarkettext.hover(hoverInB, hoverOutB, cwinemarket, cwinemarket);
		cwinemarkettext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/bottled-wine/";});
		var emlabelavailtext = paper.text(95, 215, "("+totalBottled+")");
		emlabelavailtext.attr({"fill":"#6f3842", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		//Shows
		if (displayShows == "Show") {
			var swinemarket = paper.rect(180, 155, 70, 70, 5);
			swinemarket.attr({"fill":"90-#b8c2ac-#fff", cursor: "pointer", "stroke-width":1, "stroke":"#999"});
			swinemarket.hover(hoverInB, hoverOutB, swinemarket, swinemarket);
			swinemarket.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/show-winescape/";});
			var swinemarkettext = paper.text(215, 190, "Shows");
			swinemarkettext.attr({"fill":"#3c3831", cursor: "pointer", "font-size": 13, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			swinemarkettext.hover(hoverInB, hoverOutB, swinemarket, swinemarket);
			swinemarkettext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/show-winescape/";});
		}
		//Buy Now Deals
		var bnwinemarket = paper.rect(60, 290, 70, 70, 5);
		bnwinemarket.attr({"fill":"90-#F7C62D-#fff", cursor: "pointer", "stroke-width":1, "stroke":"#999"});
		bnwinemarket.hover(hoverInBN, hoverOutBN, bnwinemarket, bnwinemarket);
		bnwinemarket.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/buy-now-deals";});
		var bnwinemarkettext = paper.text(95, 325, "Buy Now\nDeals");
		bnwinemarkettext.attr({"fill":"#3c3831", cursor: "pointer", "font-size": 13, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		bnwinemarkettext.hover(hoverInBN, hoverOutBN, bnwinemarket, bnwinemarket);
		bnwinemarkettext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/buy-now-deals/";});
    };

    function mapManageTenders() {
    }
    mapManageTenders.prototype.showMap = function(){
		//Buy Manage Tenders -----------------------------------------------------------------
		var mt = paper.rect(365, 35, 290, 360, 5);
		mt.attr({"stroke-width":2, "stroke":"#fff"});
		var mtlabeltext = paper.text(510, 60, "Manage " + prodt + " Tenders");
		mtlabeltext.attr({"fill":"#6f3842", "font-size": 18, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });

		//Lines
		var pathcurt = paper.path("M460,135L478,135");
		pathcurt.attr({stroke:'#fff', 'stroke-width': 1 ,'arrow-end': 'classic-wide-long'});
		var pathet = paper.path("M550,135L595,135L595,285");
		pathet.attr({stroke:'#fff', 'stroke-dasharray': '- ' ,'arrow-end': 'classic-wide-long'});
		var autotext = paper.text(600, 125, "AUTOMATED");
		autotext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		var ddtext = paper.text(605, 225, "EXPIRED");
		ddtext.transform("r90");
		ddtext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		//Create Tender
		var createtender = paper.rect(390, 100, 70, 70, 5);
		createtender.attr({"fill":"90-#e8c9a8-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
		createtender.hover(hoverInBT, hoverOutBT, createtender, createtender);
		createtender.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=createtender";});
		var createtendertext = paper.text(425, 135, "Create\n" + prodt + "\nTender");
		createtendertext.attr({cursor: "pointer", "fill":"#3c3831", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		createtendertext.hover(hoverInBT, hoverOutBT, createtender, createtender);
		createtendertext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=createtender";});
		//View Current Tenders
		var curtender = paper.rect(480, 100, 70, 70, 5);
		curtender.attr({"fill":"90-#e8c9a8-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
		curtender.hover(hoverInBT, hoverOutBT, curtender, curtender);
		curtender.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=tenders";});
		var curtendertext = paper.text(515, 130, "Current\n" + prodt + "\nTenders");
		curtendertext.attr({cursor: "pointer", "fill":"#3c3831", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		curtendertext.hover(hoverInBT, hoverOutBT, curtender, curtender);
		curtendertext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=tenders";});
		var curtendercount = paper.text(515, 160, '('+countTenders+')');
		curtendercount.attr({cursor: "pointer", "fill":"#3c3831", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		curtendercount.hover(hoverInBT, hoverOutBT, curtender, curtender);
		curtendercount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=tenders";});

		//Tenders Archive
		var exptender = paper.rect(560, 290, 70, 70, 5);
		exptender.attr({"fill":"90-#EDD4BA-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
		exptender.hover(hoverInBT, hoverOutBTA, exptender, exptender);
		exptender.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=tenderarchive";});
		var exptendertext = paper.text(595, 320, prodt + "\nTenders\nArchive");
		exptendertext.attr({cursor: "pointer", "fill":"#666", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		exptendertext.hover(hoverInBT, hoverOutBTA, exptender, exptender);
		exptendertext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=tenderarchive";});
		var exptendercount = paper.text(595, 350, '('+countTenderArchive+')');
		exptendercount.attr({cursor: "pointer", "fill":"#666", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		exptendercount.hover(hoverInBT, hoverOutBTA, exptender, exptender);
		exptendercount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=tenderarchive";});

    };

    function mapBuyingWine() {
		//Buy Manage Buying -------------------------------------------------
		var mb = paper.rect(725, 35, 510, 360, 5);
		mb.attr({"stroke-width":2, "stroke":"#fff"});
		var mblabeltext = paper.text(980, 60, "Manage "+prodt+" Buying");
		mblabeltext.attr({"fill":"#6f3842", "font-size": 18, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });

    	this.blnShow = false;
    };
    mapBuyingWine.prototype.showMap = function() {
    	if (this.blnShow == false) {
    		//Set the cookie
    		//$.cookie('wsprod', 'b');
    		var countColour = '';
			//Arrows
			this.patha1 = paper.path("M815,190L825,190");
			this.patha1.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.patha2 = paper.path("M895,190L905,190");
			this.patha2.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.patha3 = paper.path("M975,190L985,190");
			this.patha3.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.patha4 = paper.path("M1055,190L1065,190");
			this.patha4.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.patha5 = paper.path("M1135,190L1145,190");
			this.patha5.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			//Sample Request Cart
			this.samplereqrec = paper.rect(745, 155, 70, 70, 5);
			if (pageStatus=='samplecart') {
				this.samplereqrec.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.samplereqrec.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.samplereqrec.hover(hoverInB, hoverOutB, this.samplereqrec, this.samplereqrec);
			this.samplereqrec.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=samplecart";});
			this.samplereqrectext = paper.text(780, 185, "Sample\nRequests\nCart");
			this.samplereqrectext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqrectext.hover(hoverInB, hoverOutB, this.samplereqrec, this.samplereqrec);
			this.samplereqrectext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=samplecart";});
			this.samplereqreccount = paper.text(780, 215, '('+countSampleCart+')');
			countColour = (countSampleCart == 0 ? "#666" : "#fff");
			this.samplereqreccount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqreccount.hover(hoverInB, hoverOutB, this.samplereqrec, this.samplereqrec);
			this.samplereqreccount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=samplecart";});
			//Sample Requests Sent
			this.samplereqdispatched = paper.rect(825, 155, 70, 70, 5);
			if (pageStatus=='withsupplier') {
				this.samplereqdispatched.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.samplereqdispatched.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.samplereqdispatched.hover(hoverInB, hoverOutB, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatched.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=withsupplier";});
			this.samplereqdispatchedtext = paper.text(860, 185, "Sample\nRequests\nSent");
			this.samplereqdispatchedtext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdispatchedtext.hover(hoverInB, hoverOutB, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatchedtext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=withsupplier";});
			this.samplereqdispatchedcount = paper.text(860, 215, '('+countReqSent+')');
			this.samplereqdispatchedcount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdispatchedcount.hover(hoverInB, hoverOutB, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatchedcount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=withsupplier";});
			//Sample Requests In Transit
			this.samplereqdispatched = paper.rect(905, 155, 70, 70, 5);
			if (pageStatus=='samplessent') {
				this.samplereqdispatched.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.samplereqdispatched.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.samplereqdispatched.hover(hoverInB, hoverOutB, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatched.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=samplessent";});
			this.samplereqdispatchedtext = paper.text(940, 185, "Sample\nRequests\nIn Transit");
			this.samplereqdispatchedtext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdispatchedtext.hover(hoverInB, hoverOutB, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatchedtext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=samplessent";});
			this.samplereqdispatchedcount = paper.text(940, 215, '('+countInTransit+')');
			countColour = (countInTransit == 0 ? "#666" : "#fff");
			this.samplereqdispatchedcount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdispatchedcount.hover(hoverInB, hoverOutB, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatchedcount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=samplessent";});

			//Sample Requests Received
			this.samplereqrec = paper.rect(985, 155, 70, 70, 5);
			if (pageStatus=='received') {
				this.samplereqrec.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.samplereqrec.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.samplereqrec.hover(hoverInB, hoverOutB, this.samplereqrec, this.samplereqrec);
			this.samplereqrec.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=received";});
			this.samplereqrectext = paper.text(1020, 185, "Sample\nRequests\nReceived");
			this.samplereqrectext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqrectext.hover(hoverInB, hoverOutB, this.samplereqrec, this.samplereqrec);
			this.samplereqrectext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=received";});
			this.samplereqreccount = paper.text(1020, 215, '('+countReceived+')');
			countColour = (countReceived == 0 ? "#666" : "#fff");
			this.samplereqreccount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqreccount.hover(hoverInB, hoverOutB, this.samplereqrec, this.samplereqrec);
			this.samplereqreccount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=received";});

			//Wine Under Offer
			this.wineunderoffer = paper.rect(1065, 155, 70, 70, 5);
			if (pageStatus=='underoffer') {
				this.wineunderoffer.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.wineunderoffer.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.wineunderoffer.hover(hoverInB, hoverOutB, this.wineunderoffer, this.wineunderoffer);
			this.wineunderoffer.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=underoffer";});
			this.wineunderoffertext = paper.text(1100, 185, "Bulk\nUnder\nOffer");
			this.wineunderoffertext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wineunderoffertext.hover(hoverInB, hoverOutB, this.wineunderoffer, this.wineunderoffer);
			this.wineunderoffertext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=underoffer";});
			this.wineunderoffercount = paper.text(1100, 215, '('+countUnderOffer+')');
			countColour = (actioncountUnderOffer == 0 ? "#666" : "#fff");
			this.wineunderoffercount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wineunderoffercount.hover(hoverInB, hoverOutB, this.wineunderoffer, this.wineunderoffer);
			this.wineunderoffercount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=underoffer";});
			//Wine to be Delivered
			this.winetobedispatched = paper.rect(1145, 155, 70, 70, 5);
			if (pageStatus=='contractnote') {
				this.winetobedispatched.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.winetobedispatched.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.winetobedispatched.hover(hoverInB, hoverOutB, this.winetobedispatched, this.winetobedispatched);
			this.winetobedispatched.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=contractnote";});
			this.winetobedispatchedtext = paper.text(1180, 185, "Bulk\nTo Be\nDelivered");
			this.winetobedispatchedtext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.winetobedispatchedtext.hover(hoverInB, hoverOutB, this.winetobedispatched, this.winetobedispatched);
			this.winetobedispatchedtext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=contractnote";});
			this.winetobedispatchedcount = paper.text(1180, 215, '('+countToDeliver+')');
			countColour = (actioncountToDeliver == 0 ? "#666" : "#fff");
			this.winetobedispatchedcount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.winetobedispatchedcount.hover(hoverInB, hoverOutB, this.winetobedispatched, this.winetobedispatched);
			this.winetobedispatchedcount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=contractnote";});

			//Sample Request Archive
			this.sreqarchive = paper.rect(985, 290, 70, 70, 5);
			if (pageStatus=='archive') {
				this.sreqarchive.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.sreqarchive.attr({"fill":"90-#CAD2C1-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.sreqarchive.hover(hoverInB, hoverOutBSA, this.sreqarchive, this.sreqarchive);
			this.sreqarchive.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=archive";});
			this.sreqarchivetext = paper.text(1020, 320, "Sample\nRequest\nArchive");
			this.sreqarchivetext.attr({cursor: "pointer", "fill":"#666", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.sreqarchivetext.hover(hoverInB, hoverOutBSA, this.sreqarchive, this.sreqarchive);
			this.sreqarchivetext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=archive";});
			this.sreqarchivecount = paper.text(1020, 350, '('+countSampleArchive+')');
			this.sreqarchivecount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.sreqarchivecount.hover(hoverInB, hoverOutBSA, this.sreqarchive, this.sreqarchive);
			this.sreqarchivecount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=archive";});

			//Offer Archive
			this.oarchive = paper.rect(1065, 290, 70, 70, 5);
			if (pageStatus=='offerarchive') {
				this.oarchive.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.oarchive.attr({"fill":"90-#CAD2C1-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.oarchive.hover(hoverInB, hoverOutBSA, this.oarchive, this.oarchive);
			this.oarchive.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=offerarchive";});
			this.oarchivetext = paper.text(1100, 320, "Bulk\nOffers\nArchive");
			this.oarchivetext.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.oarchivetext.hover(hoverInB, hoverOutBSA, this.oarchive, this.oarchive);
			this.oarchivetext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=offerarchive";});
			this.oarchivecount = paper.text(1100, 350, '('+countOfferArchive+')');
			this.oarchivecount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.oarchivecount.hover(hoverInB, hoverOutBSA, this.oarchive, this.oarchive);
			this.oarchivecount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=offerarchive";});

			//Bulk Delivered
			this.wdeliv = paper.rect(1145, 290, 70, 70, 5);
			if (pageStatus=='contractarchive') {
				this.wdeliv.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.wdeliv.attr({"fill":"90-#CAD2C1-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.wdeliv.hover(hoverInB, hoverOutBSA, this.wdeliv, this.wdeliv);
			this.wdeliv.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=contractarchive";});
			this.wdelivtext = paper.text(1180, 320, "Bulk\nDelivered");
			this.wdelivtext.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wdelivtext.hover(hoverInB, hoverOutBSA, this.wdeliv, this.wdeliv);
			this.wdelivtext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=contractarchive";});
			this.wdelivcount = paper.text(1180, 350, '('+countDelivered+')');
			this.wdelivcount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wdelivcount.hover(hoverInB, hoverOutBSA, this.wdeliv, this.wdeliv);
			this.wdelivcount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=contractarchive";});

			//Automated
			this.pathet = paper.path("M550,135L860,135L860,150");
			this.pathet.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			//Samples Rejected
			this.pathsre = paper.path("M940,230L940,255L1020,255");
			this.pathsre.attr({stroke:'#fff', 'stroke-dasharray': '- '});
			this.pathsr = paper.path("M1020,230L1020,285");
			this.pathsr.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.srtext = paper.text(980, 245, "REJECTED");
			this.srtext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			//Offer Rejected
			this.pathor = paper.path("M1100,230L1100,285");
			this.pathor.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.ortext = paper.text(1110, 257, "REJECTED");
			this.ortext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			this.ortext.transform("r90");
			//Bulk Delivered
			this.pathwd = paper.path("M1180,230L1180,285");
			this.pathwd.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.wdtext = paper.text(1190, 257, "DELIVERED");
			this.wdtext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			this.wdtext.transform("r90");
			//Markets Link
			this.pathwmlbw = paper.path("M160,190L150,190");
			this.pathwmlbw.attr({stroke:'#fff', 'stroke-dasharray': '- '});
			this.pathwmlcs = paper.path("M140,325L130,325");
			this.pathwmlcs.attr({stroke:'#fff', 'stroke-dasharray': '- '});
			this.pathwml = paper.path("M160,190L160,380L780,380L780,230");
			this.pathwml.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});

			this.blnShow = true;
    	};
    };

    function mapBuyingFruit() {
		//Buy Manage Buying -------------------------------------------------
		var mb = paper.rect(725, 35, 510, 360, 5);
		mb.attr({"stroke-width":2, "stroke":"#fff"});
		var mblabeltext = paper.text(980, 60, "Manage "+prodt+" Buying");
		mblabeltext.attr({"fill":"#6f3842", "font-size": 18, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });

    	this.blnShow = false;

    };
    mapBuyingFruit.prototype.showMap = function() {
    	if (this.blnShow == false) {
    		//Set the cookie
    		//$.cookie('wsprod', 'f');
			//Arrows
			this.pathaf1 = paper.path("M815,190L825,190");
			this.pathaf1.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.pathaf2 = paper.path("M895,190L905,190");
			this.pathaf2.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.pathaf3 = paper.path("M975,190L985,190");
			this.pathaf3.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.pathaf4 = paper.path("M1055,190L1065,190");
			this.pathaf4.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			//Fruit Request Cart
			this.fruitreqrec = paper.rect(745, 155, 70, 70, 5);
			if (pageStatus=='accepted') {
				this.fruitreqrec.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.fruitreqrec.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.fruitreqrec.hover(hoverInB, hoverOutB, this.fruitreqrec, this.fruitreqrec);
			this.fruitreqrec.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=fruitcart";});
			this.fruitreqrectext = paper.text(780, 185, "Fruit\nRequests\nCart");
			this.fruitreqrectext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruitreqrectext.hover(hoverInB, hoverOutB, this.fruitreqrec, this.fruitreqrec);
			this.fruitreqrectext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=fruitcart";});
			this.fruitreqreccount = paper.text(780, 215, '('+countaccepted+')');
			countColour = (countaccepted == 0 ? "#666" : "#fff");
			this.fruitreqreccount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruitreqreccount.hover(hoverInB, hoverOutB, this.fruitreqrec, this.fruitreqrec);
			this.fruitreqreccount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=fruitcart";});
			//Fruit Requests Sent
			this.fruitreqacc = paper.rect(825, 155, 70, 70, 5);
			if (pageStatus=='withsupplier') {
				this.fruitreqacc.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.fruitreqacc.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.fruitreqacc.hover(hoverInB, hoverOutB, this.fruitreqacc, this.fruitreqacc);
			this.fruitreqacc.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=withsupplier";});
			this.fruitreqacctext = paper.text(860, 185, "Fruit\nRequests\nSent");
			this.fruitreqacctext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruitreqacctext.hover(hoverInB, hoverOutB, this.fruitreqacc, this.fruitreqacc);
			this.fruitreqacctext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=withsupplier";});
			this.fruitreqacccount = paper.text(860, 215, '('+countfruitreqacc+')');
			this.fruitreqacccount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruitreqacccount.hover(hoverInB, hoverOutB, this.fruitreqacc, this.fruitreqacc);
			this.fruitreqacccount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=withsupplier";});
			//Fruit Requests Accepted
			this.fruitreqacc = paper.rect(905, 155, 70, 70, 5);
			if (pageStatus=='accepted') {
				this.fruitreqacc.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.fruitreqacc.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.fruitreqacc.hover(hoverInB, hoverOutB, this.fruitreqacc, this.fruitreqacc);
			this.fruitreqacc.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=accepted";});
			this.fruitreqacctext = paper.text(940, 185, "Fruit\nRequests\nAccepted");
			this.fruitreqacctext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruitreqacctext.hover(hoverInB, hoverOutB, this.fruitreqacc, this.fruitreqacc);
			this.fruitreqacctext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=accepted";});
			this.fruitreqacccount = paper.text(940, 215, '('+countFruitReqAccepted+')');
			countColour = (countFruitReqAccepted == 0 ? "#666" : "#fff");
			this.fruitreqacccount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruitreqacccount.hover(hoverInB, hoverOutB, this.fruitreqacc, this.fruitreqacc);
			this.fruitreqacccount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=accepted";});
			//Fruit Under Offer
			this.fruitunderoffer = paper.rect(985, 155, 70, 70, 5);
			if (pageStatus=='underoffer') {
				this.fruitunderoffer.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.fruitunderoffer.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.fruitunderoffer.hover(hoverInB, hoverOutB, this.fruitunderoffer, this.fruitunderoffer);
			this.fruitunderoffer.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=underoffer";});
			this.fruitunderoffertext = paper.text(1020, 185, "Fruit\nUnder\nOffer");
			this.fruitunderoffertext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruitunderoffertext.hover(hoverInB, hoverOutB, this.fruitunderoffer, this.fruitunderoffer);
			this.fruitunderoffertext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=underoffer";});
			this.fruitunderoffercount = paper.text(1020, 215, '('+countFruitUnderOffer+')');
			countColour = (actioncountFruitUnderOffer == 0 ? "#666" : "#fff");
			this.fruitunderoffercount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruitunderoffercount.hover(hoverInB, hoverOutB, this.fruitunderoffer, this.fruitunderoffer);
			this.fruitunderoffercount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=accepted";});
			//Fruit to be Delivered
			this.fruittobedispatched = paper.rect(1065, 155, 70, 70, 5);
			if (pageStatus=='contractnote') {
				this.fruittobedispatched.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.fruittobedispatched.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.fruittobedispatched.hover(hoverInB, hoverOutB, this.fruittobedispatched, this.fruittobedispatched);
			this.fruittobedispatched.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=contractnote";});
			this.fruittobedispatchedtext = paper.text(1100, 185, "Fruit\nTo Be\nDelivered");
			this.fruittobedispatchedtext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruittobedispatchedtext.hover(hoverInB, hoverOutB, this.fruittobedispatched, this.fruittobedispatched);
			this.fruittobedispatchedtext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=contractnote";});
			this.fruittobedispatchedcount = paper.text(1100, 215, '('+countFruitToDeliv+')');
			countColour = (actioncountFruitToDeliv == 0 ? "#666" : "#fff");
			this.fruittobedispatchedcount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruittobedispatchedcount.hover(hoverInB, hoverOutB, this.fruittobedispatched, this.fruittobedispatched);
			this.fruittobedispatchedcount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?psel=f&status=contractnote";});
			//Fruit Request Archive
			this.freqarchive = paper.rect(905, 290, 70, 70, 5);
			if (pageStatus=='archive') {
				this.freqarchive.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.freqarchive.attr({"fill":"90-#CAD2C1-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.freqarchive.hover(hoverInB, hoverOutBSA, this.freqarchive, this.freqarchive);
			this.freqarchive.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=archive&psel=f";});
			this.freqarchivetext = paper.text(940, 320, "Fruit\nRequests\nArchive");
			this.freqarchivetext.attr({cursor: "pointer", "fill":"#666", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.freqarchivetext.hover(hoverInB, hoverOutBSA, this.freqarchive, this.freqarchive);
			this.freqarchivetext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=archive&psel=f";});
			this.freqarchivecount = paper.text(940, 350, '('+countFruitArchive+')');
			this.freqarchivecount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.freqarchivecount.hover(hoverInB, hoverOutB, this.freqarchive, this.freqarchive);
			this.freqarchivecount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=archive&psel=f";});
			//Fruit Offer Archive
			this.foarchive = paper.rect(985, 290, 70, 70, 5);
			if (pageStatus=='offerarchive') {
				this.foarchive.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.foarchive.attr({"fill":"90-#CAD2C1-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.foarchive.hover(hoverInB, hoverOutBSA, this.foarchive, this.foarchive);
			this.foarchive.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=offerarchive&psel=f";});
			this.foarchivetext = paper.text(1020, 320, "Fruit\nOffers\nArchive");
			this.foarchivetext.attr({cursor: "pointer", "fill":"#666", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.foarchivetext.hover(hoverInB, hoverOutBSA, this.foarchive, this.foarchive);
			this.foarchivetext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=offerarchive&psel=f";});
			this.foarchivecount = paper.text(1020, 350, '('+countFruitOfferArchive+')');
			this.foarchivecount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.foarchivecount.hover(hoverInB, hoverOutB, this.foarchive, this.foarchive);
			this.foarchivecount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=offerarchive&psel=f";});
			//Fruit Delivered
			this.fdispatch = paper.rect(1065, 290, 70, 70, 5);
			if (pageStatus=='contractarchive') {
				this.fdispatch.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.fdispatch.attr({"fill":"90-#CAD2C1-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.fdispatch.hover(hoverInB, hoverOutBSA, this.fdispatch, this.fdispatch);
			this.fdispatch.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=contractarchive&psel=f";});
			this.fdispatchtext = paper.text(1100, 325, "Fruit\nDelivered");
			this.fdispatchtext.attr({cursor: "pointer", "fill":"#666", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fdispatchtext.hover(hoverInB, hoverOutBSA, this.fdispatch, this.fdispatch);
			this.fdispatchtext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=contractarchive&psel=f";});
			this.fdispatchcount = paper.text(1100, 350, '('+countFruitDelivered+')');
			this.fdispatchcount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fdispatchcount.hover(hoverInB, hoverOutB, this.fdispatch, this.fdispatch);
			this.fdispatchcount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=contractarchive&psel=f";});
			//Automated
			this.pathfrs = paper.path("M550,135L860,135L860,150");
			this.pathfrs.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			//Requests Rejected
			this.pathfr = paper.path("M940,230L940,285");
			this.pathfr.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.frtext = paper.text(950, 257, "REJECTED");
			this.frtext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			this.frtext.transform("r90");
			//Offer Rejected
			this.pathfor = paper.path("M940,230L940,285");
			this.pathfor.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.fortext = paper.text(1030, 257, "REJECTED");
			this.fortext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			this.fortext.transform("r90");
			//Bulk Delivered
			this.pathfd = paper.path("M1100,230L1100,285");
			this.pathfd.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.fdtext = paper.text(1110, 257, "DELIVERED");
			this.fdtext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			this.fdtext.transform("r90");
			//Markets Link
			this.pathfmlf = paper.path("M160,190L150,190");
			this.pathfmlf.attr({stroke:'#fff', 'stroke-dasharray': '- '});
			this.pathfml = paper.path("M160,190L160,380L780,380L780,230");
			this.pathfml.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});

			this.blnShow = true;
    	};
    };

    function mapBuyingBottled() {
		//Buy Manage Buying -------------------------------------------------
		var mb = paper.rect(725, 35, 510, 360, 5);
		mb.attr({"stroke-width":2, "stroke":"#fff"});
		var mblabeltext = paper.text(980, 60, "Manage "+prodt+" Buying");
		mblabeltext.attr({"fill":"#6f3842", "font-size": 18, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });

    	this.blnShow = false;
    };
    mapBuyingBottled.prototype.showMap = function() {
    	if (this.blnShow == false) {
    		//Set the cookie
    		//$.cookie('wsprod', 'b');
    		var countColour = '';
			//Arrows
			this.patha1 = paper.path("M815,190L825,190");
			this.patha1.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.patha2 = paper.path("M882,190L889,190");
			this.patha2.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.patha3 = paper.path("M945,190L954,190");
			this.patha3.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.patha4 = paper.path("M790,150L790,135L1095,135L1100,135L1100,150");
			this.patha4.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.patha5 = paper.path("M1135,190L1145,190");
			this.patha5.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			//Sample Request Cart
			this.samplereqrec = paper.rect(745, 155, 70, 70, 5);
			if (pageStatus=='samplecart') {
				this.samplereqrec.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.samplereqrec.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.samplereqrec.hover(hoverInB, hoverOutB, this.samplereqrec, this.samplereqrec);
			this.samplereqrec.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=shortlist";});
			this.samplereqrectext = paper.text(780, 185, "Shortlist");
			this.samplereqrectext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqrectext.hover(hoverInB, hoverOutB, this.samplereqrec, this.samplereqrec);
			this.samplereqrectext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=shortlist";});
			this.samplereqreccount = paper.text(780, 215, '('+countShortlist+')');
			countColour = (countSampleCart == 0 ? "#666" : "#fff");
			this.samplereqreccount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqreccount.hover(hoverInB, hoverOutB, this.samplereqrec, this.samplereqrec);
			this.samplereqreccount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=shortlist";});
			//Sample Requests Sent
			this.samplereqdispatched = paper.rect(825, 167, 55, 58, 5);
			if (pageStatus=='withsupplier') {
				this.samplereqdispatched.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.samplereqdispatched.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.samplereqdispatched.hover(hoverInB, hoverOutB, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatched.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=withsupplier";});
			this.samplereqdispatchedtext = paper.text(854, 190, "Sample\nRequests\nSent");
			this.samplereqdispatchedtext.attr({cursor: "pointer", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdispatchedtext.hover(hoverInB, hoverOutB, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatchedtext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=withsupplier";});
			this.samplereqdispatchedcount = paper.text(854, 215, '('+countReqSent+')');
			this.samplereqdispatchedcount.attr({"fill":"#666", cursor: "pointer", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdispatchedcount.hover(hoverInB, hoverOutB, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatchedcount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=withsupplier";});
			//Sample Requests In Transit
			this.samplereqdispatched = paper.rect(890, 167, 55, 58, 5);
			if (pageStatus=='samplessent') {
				this.samplereqdispatched.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.samplereqdispatched.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.samplereqdispatched.hover(hoverInB, hoverOutB, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatched.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=samplessent";});
			this.samplereqdispatchedtext = paper.text(919, 190, "Sample\nRequests\nIn Transit");
			this.samplereqdispatchedtext.attr({cursor: "pointer", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdispatchedtext.hover(hoverInB, hoverOutB, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatchedtext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=samplessent";});
			this.samplereqdispatchedcount = paper.text(919, 215, '('+countInTransit+')');
			countColour = (countInTransit == 0 ? "#666" : "#fff");
			this.samplereqdispatchedcount.attr({"fill":countColour, cursor: "pointer", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdispatchedcount.hover(hoverInB, hoverOutB, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatchedcount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=samplessent";});

			//Sample Requests Received
			this.samplereqrec = paper.rect(955, 167, 55, 58, 5);
			if (pageStatus=='received') {
				this.samplereqrec.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.samplereqrec.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.samplereqrec.hover(hoverInB, hoverOutB, this.samplereqrec, this.samplereqrec);
			this.samplereqrec.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=received";});
			this.samplereqrectext = paper.text(983, 190, "Sample\nRequests\nReceived");
			this.samplereqrectext.attr({cursor: "pointer", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqrectext.hover(hoverInB, hoverOutB, this.samplereqrec, this.samplereqrec);
			this.samplereqrectext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=received";});
			this.samplereqreccount = paper.text(983, 215, '('+countReceived+')');
			countColour = (countReceived == 0 ? "#666" : "#fff");
			this.samplereqreccount.attr({"fill":countColour, cursor: "pointer", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqreccount.hover(hoverInB, hoverOutB, this.samplereqrec, this.samplereqrec);
			this.samplereqreccount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=received";});

			//Bottled Under Offer
			this.wineunderoffer = paper.rect(1065, 155, 70, 70, 5);
			if (pageStatus=='underoffer') {
				this.wineunderoffer.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.wineunderoffer.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.wineunderoffer.hover(hoverInB, hoverOutB, this.wineunderoffer, this.wineunderoffer);
			this.wineunderoffer.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=underoffer";});
			this.wineunderoffertext = paper.text(1100, 185, "Bottled\nUnder\nOffer");
			this.wineunderoffertext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wineunderoffertext.hover(hoverInB, hoverOutB, this.wineunderoffer, this.wineunderoffer);
			this.wineunderoffertext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=underoffer";});
			this.wineunderoffercount = paper.text(1100, 215, '('+countUnderOffer+')');
			countColour = (actioncountUnderOffer == 0 ? "#666" : "#fff");
			this.wineunderoffercount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wineunderoffercount.hover(hoverInB, hoverOutB, this.wineunderoffer, this.wineunderoffer);
			this.wineunderoffercount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=underoffer";});
			//Bottled to be Delivered
			this.winetobedispatched = paper.rect(1145, 155, 70, 70, 5);
			if (pageStatus=='contractnote') {
				this.winetobedispatched.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.winetobedispatched.attr({"fill":"90-#b8c2ac-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.winetobedispatched.hover(hoverInB, hoverOutB, this.winetobedispatched, this.winetobedispatched);
			this.winetobedispatched.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=contractnote";});
			this.winetobedispatchedtext = paper.text(1180, 185, "Bottled\nTo Be\nDelivered");
			this.winetobedispatchedtext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.winetobedispatchedtext.hover(hoverInB, hoverOutB, this.winetobedispatched, this.winetobedispatched);
			this.winetobedispatchedtext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=contractnote";});
			this.winetobedispatchedcount = paper.text(1180, 215, '('+countToDeliver+')');
			countColour = (actioncountToDeliver == 0 ? "#666" : "#fff");
			this.winetobedispatchedcount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.winetobedispatchedcount.hover(hoverInB, hoverOutB, this.winetobedispatched, this.winetobedispatched);
			this.winetobedispatchedcount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/manage-my-buying/?status=contractnote";});

			//Sample Request Archive
			this.sreqarchive = paper.rect(955, 302, 55, 58, 5);
			if (pageStatus=='archive') {
				this.sreqarchive.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.sreqarchive.attr({"fill":"90-#CAD2C1-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.sreqarchive.hover(hoverInB, hoverOutBSA, this.sreqarchive, this.sreqarchive);
			this.sreqarchive.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=archive";});
			this.sreqarchivetext = paper.text(983, 324, "Sample\nRequest\nArchive");
			this.sreqarchivetext.attr({cursor: "pointer", "fill":"#666", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.sreqarchivetext.hover(hoverInB, hoverOutBSA, this.sreqarchive, this.sreqarchive);
			this.sreqarchivetext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=archive";});
			this.sreqarchivecount = paper.text(983, 350, '('+countSampleArchive+')');
			this.sreqarchivecount.attr({"fill":"#666", cursor: "pointer", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.sreqarchivecount.hover(hoverInB, hoverOutBSA, this.sreqarchive, this.sreqarchive);
			this.sreqarchivecount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=archive";});

			//Offer Archive
			this.oarchive = paper.rect(1065, 290, 70, 70, 5);
			if (pageStatus=='offerarchive') {
				this.oarchive.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.oarchive.attr({"fill":"90-#CAD2C1-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.oarchive.hover(hoverInB, hoverOutBSA, this.oarchive, this.oarchive);
			this.oarchive.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=offerarchive";});
			this.oarchivetext = paper.text(1100, 320, "Bottled\nOffers\nArchive");
			this.oarchivetext.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.oarchivetext.hover(hoverInB, hoverOutBSA, this.oarchive, this.oarchive);
			this.oarchivetext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=offerarchive";});
			this.oarchivecount = paper.text(1100, 350, '('+countOfferArchive+')');
			this.oarchivecount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.oarchivecount.hover(hoverInB, hoverOutBSA, this.oarchive, this.oarchive);
			this.oarchivecount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=offerarchive";});

			//Bottled Delivered
			this.wdeliv = paper.rect(1145, 290, 70, 70, 5);
			if (pageStatus=='contractarchive') {
				this.wdeliv.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenubuy.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.wdeliv.attr({"fill":"90-#CAD2C1-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.wdeliv.hover(hoverInB, hoverOutBSA, this.wdeliv, this.wdeliv);
			this.wdeliv.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=contractarchive";});
			this.wdelivtext = paper.text(1180, 320, "Bottled\nDelivered");
			this.wdelivtext.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wdelivtext.hover(hoverInB, hoverOutBSA, this.wdeliv, this.wdeliv);
			this.wdelivtext.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=contractarchive";});
			this.wdelivcount = paper.text(1180, 350, '('+countDelivered+')');
			this.wdelivcount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wdelivcount.hover(hoverInB, hoverOutBSA, this.wdeliv, this.wdeliv);
			this.wdelivcount.click(function(evt){self.location.href="shop-in-the-winescape-marketplace/my-buying-archive/?status=contractarchive";});

			//Automated
			this.pathet = paper.path("M550,135L774,135L774,149");
			this.pathet.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			//Samples Rejected
			this.pathsre = paper.path("M920,230L920,255L983,255");
			this.pathsre.attr({stroke:'#fff', 'stroke-dasharray': '- '});
			this.pathsr = paper.path("M983,230L983,295");
			this.pathsr.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.srtext = paper.text(952, 245, "REJECTED");
			this.srtext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			//Offer Rejected
			this.pathor = paper.path("M1100,230L1100,285");
			this.pathor.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.ortext = paper.text(1110, 257, "REJECTED");
			this.ortext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			this.ortext.transform("r90");
			//Bottled Delivered
			this.pathwd = paper.path("M1180,230L1180,285");
			this.pathwd.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.wdtext = paper.text(1190, 257, "DELIVERED");
			this.wdtext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			this.wdtext.transform("r90");
			//Markets Link
			this.pathwmlbw = paper.path("M160,190L150,190");
			this.pathwmlbw.attr({stroke:'#fff', 'stroke-dasharray': '- '});
			this.pathwml = paper.path("M160,190L160,375L780,375L780,230");
			this.pathwml.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			//Buy Now Deals
			this.pathbnd = paper.path("M95,365L95,385L1225,385L1225,135,135L1180,135,150L1180,150");
			this.pathbnd.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});

			this.blnShow = true;
    	};
    };


	//Buy Enter Markets
	var canvas = document.getElementById("mapmybuying");
	if (canvas) {
		// Creates Raphael canvas on canvas element
		var paper = Raphael(canvas, '100%', '100%');
		// the following line makes the Raphael paper fill its container
		//paper.setViewBox(0, 0, c.width, c.height, true);
		paper.setViewBox(0, 0, 1250, 400, true);

		//Layout
		if (prodType=='Fruit'){
			var mapentermarkets = new mapEnterFruitMarket();
			var mapmanagetenders = new mapManageTenders();
			var mapbuy = new mapBuyingFruit();
			mapentermarkets.showMap();
			mapmanagetenders.showMap();
			mapbuy.showMap();
		} else if (prodType=='Bulk Wine'){
			var mapentermarkets = new mapEnterWineMarket();
			var mapmanagetenders = new mapManageTenders();
			var mapbuy = new mapBuyingWine();
			mapentermarkets.showMap();
			mapmanagetenders.showMap();
			mapbuy.showMap();
		} else if (prodType=='Bottled Wine'){
			var mapentermarkets = new mapEnterBottledMarket();
			var mapmanagetenders = new mapManageTenders();
			var mapbuy = new mapBuyingBottled();
			mapentermarkets.showMap();
			mapmanagetenders.showMap();
			mapbuy.showMap();
		}

	}
}

function showMapSelling(
		prodType,
		displayShows,
		countTenders,
		countTenderSubmissions,
		countTenderSubmissionArchive,
		countReceived,
		countAccepted,
		countSamplesSent,
		countDelivered,
		countUnderOffer,
		actioncountUnderOffer,
		countToBeDispatched,
		countSampleArchive,
		countOfferArchive,
		countDispatched,
		countFruitReqRec,
		countFruitReqAccepted,
		countFruitUnderOffer,
		actioncountFruitUnderOffer,
		countFruitToDispatch,
		countFruitArchive,
		countFruitOfferArchive,
		countFruitDispatched,
		strVineyardURL,
		pageStatus
		) {

	//Product Type
	if (prodType == 'Bulk Wine') {
		var prodt = 'Bulk';
	} else if (prodType == 'Bottled Wine') {
		var prodt = 'Bottled';
	} else {
		var prodt = prodType;
	}

	//Set up hover attributes
    var hoverInS = function() {
        this.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width": 2});
    };
    var hoverOutS = function() {
        this.attr({"fill":"90-#c9959c-#fff", "stroke-width": 1});
    };
    var hoverInST = function() {
        this.attr({"fill":"#ECDBC6", "stroke-width": 2});
    };
    var hoverOutST = function() {
        this.attr({"fill":"90-#e8c9a8-#fff", "stroke-width": 1});
    };
    var hoverOutSTA = function() {
        this.attr({"fill":"90-#EDD4BA-#ddd", "stroke-width": 1});
    };
    var hoverOutSSA = function() {
        this.attr({"fill":"90-#CFA8AE-#ddd", "stroke-width": 1});
    };
    var hoverInR = function() {
        this.attr({"stroke-width": 2});
    };
    var hoverOutR = function() {
        this.attr({"stroke-width": 1});
    };
    var hoverSelect = function(ob) {
        ob.attr({"fill":"#666", "stroke-width": 2});
    };
    var hoverDeselect = function(ob) {
        ob.attr({"fill":"#EDEDED", "stroke-width": 1});
    };

    function mapSupplyFruitMarket() {
    }
    mapSupplyFruitMarket.prototype.showMap = function(){
		//Supply Markets
		var em = paper.rect(5, 35, 290, 360, 5);
		em.attr({"stroke-width":2, "stroke":"#fff"});
		var emlabeltext = paper.text(150, 60, "Supply "+prodt+" Market");
		emlabeltext.attr({"fill":"#6f3842", "font-size": 18, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		//View Current Listing
		var viewlisting = paper.rect(115, 100, 70, 70, 5);
		viewlisting.attr({"fill":"90-#c9959c-#fff", cursor: "pointer", "stroke-width":1, "stroke":"#999"});
		viewlisting.hover(hoverInS, hoverOutS, viewlisting, viewlisting);
		viewlisting.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/upload-my-wine/";});
		var viewlistingtext = paper.text(150, 135, "My\nFruit\nListing");
		viewlistingtext.attr({"fill":"#3c3831", cursor: "pointer", "font-size": 13, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		viewlistingtext.hover(hoverInS, hoverOutS, viewlisting, viewlisting);
		viewlistingtext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/upload-my-wine/";});
		//Vineyard Overview
		var vineyard = paper.rect(115, 195, 70, 70, 5);
		if (strVineyardURL == '') {
			vineyard.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#A5959E"});
			var vineyardtext = paper.text(150, 230, "Vineyard\nOverview");
			vineyardtext.attr({"fill":"#A5959E", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		} else {
			vineyard.attr({"fill":"90-#c9959c-#fff", cursor: "pointer", "stroke-width":1, "stroke":"#999"});
			vineyard.hover(hoverInS, hoverOutS, vineyard, vineyard);
			vineyard.click(function(evt){window.open(strVineyardURL);});
			var vineyardtext = paper.text(150, 230, "Vineyard\nOverview");
			vineyardtext.attr({"fill":"#3c3831", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			vineyardtext.hover(hoverInS, hoverOutS, vineyard, vineyard);
			vineyardtext.click(function(evt){window.open(strVineyardURL);});
		}
		//Shows
		if (displayShows == "Show") {
			var viewshows = paper.rect(115, 290, 70, 70, 5);
			viewshows.attr({"fill":"90-#c9959c-#fff", cursor: "pointer", "stroke-width":1, "stroke":"#999"});
			viewshows.hover(hoverInS, hoverOutS, viewshows, viewshows);
			viewshows.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/show-winescape-supplier/";});
			var viewshowstext = paper.text(150, 325, "Shows");
			viewshowstext.attr({"fill":"#3c3831", cursor: "pointer", "font-size": 13, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			viewshowstext.hover(hoverInS, hoverOutS, viewshows, viewshows);
			viewshowstext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/show-winescape-supplier/";});
		}
    }

    function mapSupplyWineMarket() {
    }
    mapSupplyWineMarket.prototype.showMap = function(){
		//Supply Markets
		var em = paper.rect(5, 35, 290, 360, 5);
		em.attr({"stroke-width":2, "stroke":"#fff"});
		var emlabeltext = paper.text(150, 60, "Supply "+prodt+" Market");
		emlabeltext.attr({"fill":"#6f3842", "font-size": 18, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		//View Current Listing
		var viewlisting = paper.rect(115, 100, 70, 70, 5);
		viewlisting.attr({"fill":"90-#c9959c-#fff", cursor: "pointer", "stroke-width":1, "stroke":"#999"});
		viewlisting.hover(hoverInS, hoverOutS, viewlisting, viewlisting);
		viewlisting.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/upload-my-wine/";});
		var viewlistingtext = paper.text(150, 135, "My\nBulk\nListing");
		viewlistingtext.attr({"fill":"#3c3831", cursor: "pointer", "font-size": 13, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		viewlistingtext.hover(hoverInS, hoverOutS, viewlisting, viewlisting);
		viewlistingtext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/upload-my-wine/";});
		//Shows
		if (displayShows == "Show") {
			var viewshows = paper.rect(115, 195, 70, 70, 5);
			viewshows.attr({"fill":"90-#c9959c-#fff", cursor: "pointer", "stroke-width":1, "stroke":"#999"});
			viewshows.hover(hoverInS, hoverOutS, viewshows, viewshows);
			viewshows.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/show-winescape-supplier/";});
			var viewshowstext = paper.text(150, 230, "Shows");
			viewshowstext.attr({"fill":"#3c3831", cursor: "pointer", "font-size": 13, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			viewshowstext.hover(hoverInS, hoverOutS, viewshows, viewshows);
			viewshowstext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/show-winescape-supplier/";});
		}
    }

    function mapSupplyBottledMarket() {
    }
    mapSupplyBottledMarket.prototype.showMap = function(){
		//Supply Markets
		var em = paper.rect(5, 35, 290, 360, 5);
		em.attr({"stroke-width":2, "stroke":"#fff"});
		var emlabeltext = paper.text(150, 60, "Supply "+prodt+" Market");
		emlabeltext.attr({"fill":"#6f3842", "font-size": 18, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		//View Current Listing
		var viewlisting = paper.rect(115, 100, 70, 70, 5);
		viewlisting.attr({"fill":"90-#c9959c-#fff", cursor: "pointer", "stroke-width":1, "stroke":"#999"});
		viewlisting.hover(hoverInS, hoverOutS, viewlisting, viewlisting);
		viewlisting.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/upload-my-wine/";});
		var viewlistingtext = paper.text(150, 135, "My\nBottled\nListing");
		viewlistingtext.attr({"fill":"#3c3831", cursor: "pointer", "font-size": 13, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		viewlistingtext.hover(hoverInS, hoverOutS, viewlisting, viewlisting);
		viewlistingtext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/upload-my-wine/";});
		//Shows
		//Shows
		if (displayShows == "Show") {
			var viewshows = paper.rect(115, 195, 70, 70, 5);
			viewshows.attr({"fill":"90-#c9959c-#fff", cursor: "pointer", "stroke-width":1, "stroke":"#999"});
			viewshows.hover(hoverInS, hoverOutS, viewshows, viewshows);
			viewshows.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/show-winescape-supplier/";});
			var viewshowstext = paper.text(150, 230, "Shows");
			viewshowstext.attr({"fill":"#3c3831", cursor: "pointer", "font-size": 13, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			viewshowstext.hover(hoverInS, hoverOutS, viewshows, viewshows);
			viewshowstext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/show-winescape-supplier/";});
		}
    }


    function mapSubmitToTender() {
    }
    mapSubmitToTender.prototype.showMap = function(){
		//Sell Manage Tenders -----------------------------------------------------------------
		var mt = paper.rect(365, 35, 290, 360, 5);
		mt.attr({"stroke-width":2, "stroke":"#fff"});
		var mtlabeltext = paper.text(510, 60, "Submit To " + prodt + " Tenders");
		mtlabeltext.attr({"fill":"#6f3842", "font-size": 18, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		//Lines
		var pathcurt = paper.path("M460,135L478,135");
		pathcurt.attr({stroke:'#fff', 'stroke-width': 1 ,'arrow-end': 'classic-wide-long'});
		var pathet = paper.path("M550,135L595,135L595,285");
		pathet.attr({stroke:'#fff', 'stroke-dasharray': '- ' ,'arrow-end': 'classic-wide-long'});
		var autotext = paper.text(600, 125, "AUTOMATED");
		autotext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		var ddtext = paper.text(605, 225, "EXPIRED");
		ddtext.transform("r90");
		ddtext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		//View Tenders
		var viewtenders = paper.rect(390, 100, 70, 70, 5);
		viewtenders.attr({"fill":"90-#e8c9a8-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
		viewtenders.hover(hoverInST, hoverOutST, viewtenders, viewtenders);
		viewtenders.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=tenders";});
		var viewtenderstext = paper.text(425, 130, prodt + "\nTenders");
		viewtenderstext.attr({cursor: "pointer", "fill":"#3c3831", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		viewtenderstext.hover(hoverInST, hoverOutST, viewtenders, viewtenders);
		viewtenderstext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=tenders";});
		var viewtenderscount = paper.text(425, 160, '('+countTenders+')');
		viewtenderscount.attr({cursor: "pointer", "fill":"#3c3831", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		viewtenderscount.hover(hoverInST, hoverOutST, viewtenders, viewtenders);
		viewtenderscount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=tendersubmissions";});
		//View Current Tenders Submissions
		var curtender = paper.rect(480, 100, 70, 70, 5);
		curtender.attr({"fill":"90-#e8c9a8-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
		curtender.hover(hoverInST, hoverOutST, curtender, curtender);
		curtender.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=tendersubmissions";});
		var curtendertext = paper.text(515, 130, prodt + "\nTender\nSubmissions");
		curtendertext.attr({cursor: "pointer", "fill":"#3c3831", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		curtendertext.hover(hoverInST, hoverOutST, curtender, curtender);
		curtendertext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=tendersubmissions";});
		var curtendercount = paper.text(515, 160, '('+countTenderSubmissions+')');
		curtendercount.attr({cursor: "pointer", "fill":"#3c3831", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		curtendercount.hover(hoverInST, hoverOutST, curtender, curtender);
		curtendercount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=tendersubmissions";});

		//Tender Submissions Archive
		var exptender = paper.rect(560, 290, 70, 70, 5);
		exptender.attr({"fill":"90-#EDD4BA-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
		exptender.hover(hoverInST, hoverOutSTA, exptender, exptender);
		exptender.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=tendersubmissionarchive";});
		var exptendertext = paper.text(595, 320, prodt + "\nSubmissions\nArchive");
		exptendertext.attr({cursor: "pointer", "fill":"#666", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		exptendertext.hover(hoverInST, hoverOutSTA, exptender, exptender);
		exptendertext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=tendersubmissionarchive";});
		var exptendercount = paper.text(595, 350, '('+countTenderSubmissionArchive+')');
		exptendercount.attr({cursor: "pointer", "fill":"#666", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
		exptendercount.hover(hoverInST, hoverOutSTA, exptender, exptender);
		exptendercount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=tendersubmissionarchive";});

    }


    function mapSellingFruit() {
		//Sell Manage Selling -------------------------------------------------
		var mb = paper.rect(725, 35, 510, 360, 5);
		mb.attr({"stroke-width":2, "stroke":"#fff"});
		var mblabeltext = paper.text(980, 60, "Manage Fruit Selling");
		mblabeltext.attr({"fill":"#6f3842", "font-size": 18, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });

    	this.blnShow = false;
    };
    mapSellingFruit.prototype.showMap = function() {
    	if (this.blnShow == false) {
			//Arrows
			this.pathaf1 = paper.path("M815,190L825,190");
			this.pathaf1.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.pathaf2 = paper.path("M895,190L905,190");
			this.pathaf2.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.pathaf3 = paper.path("M975,190L985,190");
			this.pathaf3.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			//Fruit Requests Received
			this.fruitreqrec = paper.rect(745, 155, 70, 70, 5);
			if (pageStatus=='accepted') {
				this.fruitreqrec.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.fruitreqrec.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.fruitreqrec.hover(hoverInS, hoverOutS, this.fruitreqrec, this.fruitreqrec);
			this.fruitreqrec.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?psel=f&status=withsupplier";});
			this.fruitreqrectext = paper.text(780, 185, "Fruit\nRequests\nReceived");
			this.fruitreqrectext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruitreqrectext.hover(hoverInS, hoverOutS, this.fruitreqrec, this.fruitreqrec);
			this.fruitreqrectext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?psel=f&status=withsupplier";});
			this.fruitreqreccount = paper.text(780, 215, '('+countFruitReqRec+')');
			countColour = (countFruitReqRec == 0 ? "#666" : "#fff");
			this.fruitreqreccount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruitreqreccount.hover(hoverInS, hoverOutS, this.fruitreqrec, this.fruitreqrec);
			this.fruitreqreccount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?psel=f&status=withsupplier";});
			//Fruit Requests Accepted
			this.fruitreqacc = paper.rect(825, 155, 70, 70, 5);
			if (pageStatus=='accepted') {
				this.fruitreqacc.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.fruitreqacc.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.fruitreqacc.hover(hoverInS, hoverOutS, this.fruitreqacc, this.fruitreqacc);
			this.fruitreqacc.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?psel=f&status=accepted";});
			this.fruitreqacctext = paper.text(860, 185, "Fruit\nRequests\nAccepted");
			this.fruitreqacctext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruitreqacctext.hover(hoverInS, hoverOutS, this.fruitreqacc, this.fruitreqacc);
			this.fruitreqacctext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?psel=f&status=accepted";});
			this.fruitreqacccount = paper.text(860, 215, '('+countFruitReqAccepted+')');
			this.fruitreqacccount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruitreqacccount.hover(hoverInS, hoverOutS, this.fruitreqacc, this.fruitreqacc);
			this.fruitreqacccount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?psel=f&status=accepted";});
			//Fruit Under Offer
			this.fruitunderoffer = paper.rect(905, 155, 70, 70, 5);
			if (pageStatus=='underoffer') {
				this.fruitunderoffer.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.fruitunderoffer.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.fruitunderoffer.hover(hoverInS, hoverOutS, this.fruitunderoffer, this.fruitunderoffer);
			this.fruitunderoffer.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?psel=f&status=underoffer";});
			this.fruitunderoffertext = paper.text(940, 185, "Fruit\nUnder\nOffer");
			this.fruitunderoffertext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruitunderoffertext.hover(hoverInS, hoverOutS, this.fruitunderoffer, this.fruitunderoffer);
			this.fruitunderoffertext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?psel=f&status=underoffer";});
			this.fruitunderoffercount = paper.text(940, 215, '('+countFruitUnderOffer+')');
			countColour = (actioncountFruitUnderOffer == 0 ? "#666" : "#fff");
			this.fruitunderoffercount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruitunderoffercount.hover(hoverInS, hoverOutS, this.fruitunderoffer, this.fruitunderoffer);
			this.fruitunderoffercount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?psel=f&status=accepted";});
			//Fruit to be Dispatched
			this.fruittobedispatched = paper.rect(985, 155, 70, 70, 5);
			if (pageStatus=='contractnote') {
				this.fruittobedispatched.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.fruittobedispatched.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.fruittobedispatched.hover(hoverInS, hoverOutS, this.fruittobedispatched, this.fruittobedispatched);
			this.fruittobedispatched.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?psel=f&status=contractnote";});
			this.fruittobedispatchedtext = paper.text(1020, 185, "Fruit\nTo\nDispatch");
			this.fruittobedispatchedtext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruittobedispatchedtext.hover(hoverInS, hoverOutS, this.fruittobedispatched, this.fruittobedispatched);
			this.fruittobedispatchedtext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?psel=f&status=contractnote";});
			this.fruittobedispatchedcount = paper.text(1020, 215, '('+countFruitToDispatch+')');
			countColour = (countFruitToDispatch == 0 ? "#666" : "#fff");
			this.fruittobedispatchedcount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fruittobedispatchedcount.hover(hoverInS, hoverOutS, this.fruittobedispatched, this.fruittobedispatched);
			this.fruittobedispatchedcount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?psel=f&status=contractnote";});
			//Fruit Request Archive
			this.freqarchive = paper.rect(825, 290, 70, 70, 5);
			if (pageStatus=='archive') {
				this.freqarchive.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.freqarchive.attr({"fill":"90-#CFA8AE-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.freqarchive.hover(hoverInS, hoverOutSSA, this.freqarchive, this.freqarchive);
			this.freqarchive.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=archive&psel=f";});
			this.freqarchivetext = paper.text(860, 320, "Fruit\nRequests\nArchive");
			this.freqarchivetext.attr({cursor: "pointer", "fill":"#666", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.freqarchivetext.hover(hoverInS, hoverOutSSA, this.freqarchive, this.freqarchive);
			this.freqarchivetext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=archive&psel=f";});
			this.freqarchivecount = paper.text(860, 350, '('+countFruitArchive+')');
			this.freqarchivecount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.freqarchivecount.hover(hoverInS, hoverOutS, this.freqarchive, this.freqarchive);
			this.freqarchivecount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=archive&psel=f";});
			//Fruit Offer Archive
			this.foarchive = paper.rect(905, 290, 70, 70, 5);
			if (pageStatus=='offerarchive') {
				this.foarchive.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.foarchive.attr({"fill":"90-#CFA8AE-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.foarchive.hover(hoverInS, hoverOutSSA, this.foarchive, this.foarchive);
			this.foarchive.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=offerarchive&psel=f";});
			this.foarchivetext = paper.text(940, 320, "Fruit\nOffers\nArchive");
			this.foarchivetext.attr({cursor: "pointer", "fill":"#666", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.foarchivetext.hover(hoverInS, hoverOutSSA, this.foarchive, this.foarchive);
			this.foarchivetext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=offerarchive&psel=f";});
			this.foarchivecount = paper.text(940, 350, '('+countFruitOfferArchive+')');
			this.foarchivecount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.foarchivecount.hover(hoverInS, hoverOutS, this.foarchive, this.foarchive);
			this.foarchivecount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=offerarchive&psel=f";});
			//Fruit Dispatched
			this.fdispatch = paper.rect(985, 290, 70, 70, 5);
			if (pageStatus=='contractarchive') {
				this.fdispatch.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.fdispatch.attr({"fill":"90-#CFA8AE-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.fdispatch.hover(hoverInS, hoverOutSSA, this.fdispatch, this.fdispatch);
			this.fdispatch.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=contractarchive&psel=f";});
			this.fdispatchtext = paper.text(1020, 325, "Fruit\nDispatched");
			this.fdispatchtext.attr({cursor: "pointer", "fill":"#666", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fdispatchtext.hover(hoverInS, hoverOutSSA, this.fdispatch, this.fdispatch);
			this.fdispatchtext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=contractarchive&psel=f";});
			this.fdispatchcount = paper.text(1020, 350, '('+countFruitDispatched+')');
			this.fdispatchcount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.fdispatchcount.hover(hoverInS, hoverOutS, this.fdispatch, this.fdispatch);
			this.fdispatchcount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=contractarchive&psel=f";});
			//Automated
			this.pathfrs = paper.path("M550,135L780,135L780,150");
			this.pathfrs.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			//Requests Archive
			this.pathra = paper.path("M860,230L860,285");
			this.pathra.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.pathfra = paper.path("M780,230L780,255L860,255");
			this.pathfra.attr({stroke:'#fff', 'stroke-dasharray': '- '});
			this.fratext = paper.text(820, 245, "REJECTED");
			this.fratext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			//Requests Rejected
			this.pathfr = paper.path("M940,230L940,285");
			this.pathfr.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.frtext = paper.text(950, 257, "REJECTED");
			this.frtext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			this.frtext.transform("r90");
			//Wine Dispatched
			this.pathfd = paper.path("M1020,230L1020,285");
			this.pathfd.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.fdtext = paper.text(1030, 257, "DISPATCHED");
			this.fdtext.attr({"fill":"#fff", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			this.fdtext.transform("r90");

			this.blnShow = true;
    	};
    };

    function mapSellingWine() {
		//Sell Manage Selling -------------------------------------------------
		var mb = paper.rect(725, 35, 510, 360, 5);
		mb.attr({"stroke-width":2, "stroke":"#fff"});
		var mblabeltext = paper.text(980, 60, "Manage Bulk Selling");
		mblabeltext.attr({"fill":"#6f3842", "font-size": 18, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });

    	this.blnShow = false;
    };
    mapSellingWine.prototype.showMap = function() {
    	if (this.blnShow == false) {
    		var countColour = '';
			//Arrows
			this.patha1 = paper.path("M815,190L825,190");
			this.patha1.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.patha2 = paper.path("M895,190L905,190");
			this.patha2.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.patha3 = paper.path("M975,190L985,190");
			this.patha3.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.patha4 = paper.path("M1055,190L1065,190");
			this.patha4.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			//Sample Request Received
			this.samplereqrec = paper.rect(745, 155, 70, 70, 5);
			if (pageStatus=='accepted') {
				this.samplereqrec.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.samplereqrec.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.samplereqrec.hover(hoverInS, hoverOutS, this.samplereqrec, this.samplereqrec);
			this.samplereqrec.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=withsupplier";});
			this.samplereqrectext = paper.text(780, 185, "Sample\nRequests\nReceived");
			this.samplereqrectext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqrectext.hover(hoverInS, hoverOutS, this.samplereqrec, this.samplereqrec);
			this.samplereqrectext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=withsupplier";});
			this.samplereqreccount = paper.text(780, 215, '('+countReceived+')');
			countColour = (countReceived == 0 ? "#666" : "#fff");
			this.samplereqreccount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqreccount.hover(hoverInS, hoverOutS, this.samplereqrec, this.samplereqrec);
			this.samplereqreccount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=withsupplier";});
			//Sample Requests Dispatched
			this.samplereqdispatched = paper.rect(825, 155, 70, 70, 5);
			if (pageStatus=='samplessent') {
				this.samplereqdispatched.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.samplereqdispatched.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.samplereqdispatched.hover(hoverInS, hoverOutS, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatched.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=samplessent";});
			this.samplereqdispatchedtext = paper.text(860, 185, "Sample\nRequests\nDispatched");
			this.samplereqdispatchedtext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdispatchedtext.hover(hoverInS, hoverOutS, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatchedtext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=samplessent";});
			this.samplereqdispatchedcount = paper.text(860, 215, '('+countSamplesSent+')');
			this.samplereqdispatchedcount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdispatchedcount.hover(hoverInS, hoverOutS, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatchedcount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=samplessent";});
			//Sample Requests Delivered
			this.samplereqdelivered = paper.rect(905, 155, 70, 70, 5);
			if (pageStatus=='received') {
				this.samplereqdelivered.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.samplereqdelivered.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.samplereqdelivered.hover(hoverInS, hoverOutS, this.samplereqdelivered, this.samplereqdelivered);
			this.samplereqdelivered.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=received";});
			this.samplereqdeliveredtext = paper.text(940, 185, "Sample\nRequests\nDelivered");
			this.samplereqdeliveredtext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdeliveredtext.hover(hoverInS, hoverOutS, this.samplereqdelivered, this.samplereqdelivered);
			this.samplereqdeliveredtext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=received";});
			this.samplereqdeliveredcount = paper.text(940, 215, '('+countDelivered+')');
			countColour = (countDelivered == 0 ? "#666" : "#fff");
			this.samplereqdeliveredcount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdeliveredcount.hover(hoverInS, hoverOutS, this.samplereqdelivered, this.samplereqdelivered);
			this.samplereqdeliveredcount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=received";});
			//Wine Under Offer
			this.wineunderoffer = paper.rect(985, 155, 70, 70, 5);
			if (pageStatus=='underoffer') {
				this.wineunderoffer.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.wineunderoffer.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.wineunderoffer.hover(hoverInS, hoverOutS, this.wineunderoffer, this.wineunderoffer);
			this.wineunderoffer.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=underoffer";});
			this.wineunderoffertext = paper.text(1020, 185, "Bulk\nUnder\nOffer");
			this.wineunderoffertext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wineunderoffertext.hover(hoverInS, hoverOutS, this.wineunderoffer, this.wineunderoffer);
			this.wineunderoffertext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=underoffer";});
			this.wineunderoffercount = paper.text(1020, 215, '('+countUnderOffer+')');
			countColour = (actioncountUnderOffer == 0 ? "#666" : "#fff");
			this.wineunderoffercount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wineunderoffercount.hover(hoverInS, hoverOutS, this.wineunderoffer, this.wineunderoffer);
			this.wineunderoffercount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=underoffer";});
			//Wine to be Dispatched
			this.winetobedispatched = paper.rect(1065, 155, 70, 70, 5);
			if (pageStatus=='contractnote') {
				this.winetobedispatched.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.winetobedispatched.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.winetobedispatched.hover(hoverInS, hoverOutS, this.winetobedispatched, this.winetobedispatched);
			this.winetobedispatched.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=contractnote";});
			this.winetobedispatchedtext = paper.text(1100, 185, "Bulk\nTo\nDispatch");
			this.winetobedispatchedtext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.winetobedispatchedtext.hover(hoverInS, hoverOutS, this.winetobedispatched, this.winetobedispatched);
			this.winetobedispatchedtext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=contractnote";});
			this.winetobedispatchedcount = paper.text(1100, 215, '('+countToBeDispatched+')');
			countColour = (countToBeDispatched == 0 ? "#666" : "#fff");
			this.winetobedispatchedcount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.winetobedispatchedcount.hover(hoverInS, hoverOutS, this.winetobedispatched, this.winetobedispatched);
			this.winetobedispatchedcount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=contractnote";});

			//Sample Request Archive
			this.sreqarchive = paper.rect(905, 290, 70, 70, 5);
			if (pageStatus=='archive') {
				this.sreqarchive.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.sreqarchive.attr({"fill":"90-#CFA8AE-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.sreqarchive.hover(hoverInS, hoverOutSSA, this.sreqarchive, this.sreqarchive);
			this.sreqarchive.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=archive";});
			this.sreqarchivetext = paper.text(940, 320, "Sample\nRequest\nArchive");
			this.sreqarchivetext.attr({cursor: "pointer", "fill":"#666", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.sreqarchivetext.hover(hoverInS, hoverOutSSA, this.sreqarchive, this.sreqarchive);
			this.sreqarchivetext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=archive";});
			this.sreqarchivecount = paper.text(940, 350, '('+countSampleArchive+')');
			this.sreqarchivecount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.sreqarchivecount.hover(hoverInS, hoverOutSSA, this.sreqarchive, this.sreqarchive);
			this.sreqarchivecount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=archive";});

			//Offer Archive
			this.oarchive = paper.rect(985, 290, 70, 70, 5);
			if (pageStatus=='offerarchive') {
				this.oarchive.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.oarchive.attr({"fill":"90-#CFA8AE-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.oarchive.hover(hoverInS, hoverOutSSA, this.oarchive, this.oarchive);
			this.oarchive.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=offerarchive";});
			this.oarchivetext = paper.text(1020, 320, "Bulk\nOffers\nArchive");
			this.oarchivetext.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.oarchivetext.hover(hoverInS, hoverOutSSA, this.oarchive, this.oarchive);
			this.oarchivetext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=offerarchive";});
			this.oarchivecount = paper.text(1020, 350, '('+countOfferArchive+')');
			this.oarchivecount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.oarchivecount.hover(hoverInS, hoverOutSSA, this.oarchive, this.oarchive);
			this.oarchivecount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=offerarchive";});

			//Bulk Delivered
			this.wdeliv = paper.rect(1065, 290, 70, 70, 5);
			if (pageStatus=='contractarchive') {
				this.wdeliv.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.wdeliv.attr({"fill":"90-#CFA8AE-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.wdeliv.hover(hoverInS, hoverOutSSA, this.wdeliv, this.wdeliv);
			this.wdeliv.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=contractarchive";});
			this.wdelivtext = paper.text(1100, 320, "Bulk\nDispatched");
			this.wdelivtext.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wdelivtext.hover(hoverInS, hoverOutSSA, this.wdeliv, this.wdeliv);
			this.wdelivtext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=contractarchive";});
			this.wdelivcount = paper.text(1100, 350, '('+countDispatched+')');
			this.wdelivcount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wdelivcount.hover(hoverInS, hoverOutSSA, this.wdeliv, this.wdeliv);
			this.wdelivcount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=contractarchive";});

			//Automated
			this.pathet = paper.path("M550,135L780,135L780,150");
			this.pathet.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			//Samples Rejected
			this.pathsre = paper.path("M780,230L780,255L940,255");
			this.pathsre.attr({stroke:'#fff', 'stroke-dasharray': '- '});
			this.pathsr = paper.path("M940,230L940,285");
			this.pathsr.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.srtext = paper.text(860, 245, "REJECTED");
			this.srtext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			//Offer Rejected
			this.pathor = paper.path("M1020,230L1020,285");
			this.pathor.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.ortext = paper.text(1030, 257, "REJECTED");
			this.ortext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			this.ortext.transform("r90");
			//Bulk Delivered
			this.pathwd = paper.path("M1100,230L1100,285");
			this.pathwd.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.wdtext = paper.text(1110, 257, "DISPATCHED");
			this.wdtext.attr({"fill":"#fff", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			this.wdtext.transform("r90");

			this.blnShow = true;
    	};
    };


    function mapSellingBottled() {
		//Sell Manage Selling -------------------------------------------------
		var mb = paper.rect(725, 35, 510, 360, 5);
		mb.attr({"stroke-width":2, "stroke":"#fff"});
		var mblabeltext = paper.text(980, 60, "Manage Bottled Selling");
		mblabeltext.attr({"fill":"#6f3842", "font-size": 18, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });

    	this.blnShow = false;
    };
    mapSellingBottled.prototype.showMap = function() {
    	if (this.blnShow == false) {
    		var countColour = '';
			//Arrows
			this.patha1 = paper.path("M805,190L820,190");
			this.patha1.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.patha2 = paper.path("M875,190L890,190");
			this.patha2.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			//this.patha3 = paper.path("M975,190L985,190");
			//this.patha3.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			this.patha4 = paper.path("M1055,190L1065,190");
			this.patha4.attr({stroke:'#fff', 'stroke-width': 1,'arrow-end': 'classic-wide-long'});
			//Sample Request Received
			this.samplereqrec = paper.rect(752, 167, 55, 58, 5);
			if (pageStatus=='accepted') {
				this.samplereqrec.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.samplereqrec.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.samplereqrec.hover(hoverInS, hoverOutS, this.samplereqrec, this.samplereqrec);
			this.samplereqrec.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=withsupplier";});
			this.samplereqrectext = paper.text(780, 190, "Sample\nRequests\nReceived");
			this.samplereqrectext.attr({cursor: "pointer", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqrectext.hover(hoverInS, hoverOutS, this.samplereqrec, this.samplereqrec);
			this.samplereqrectext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=withsupplier";});
			this.samplereqreccount = paper.text(780, 215, '('+countReceived+')');
			countColour = (countReceived == 0 ? "#666" : "#fff");
			this.samplereqreccount.attr({"fill":countColour, cursor: "pointer", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqreccount.hover(hoverInS, hoverOutS, this.samplereqrec, this.samplereqrec);
			this.samplereqreccount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=withsupplier";});
			//Sample Requests Dispatched
			this.samplereqdispatched = paper.rect(820, 167, 55, 58, 5);
			if (pageStatus=='samplessent') {
				this.samplereqdispatched.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.samplereqdispatched.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.samplereqdispatched.hover(hoverInS, hoverOutS, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatched.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=samplessent";});
			this.samplereqdispatchedtext = paper.text(848, 190, "Sample\nRequests\nDispatched");
			this.samplereqdispatchedtext.attr({cursor: "pointer", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdispatchedtext.hover(hoverInS, hoverOutS, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatchedtext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=samplessent";});
			this.samplereqdispatchedcount = paper.text(848, 215, '('+countSamplesSent+')');
			this.samplereqdispatchedcount.attr({"fill":"#666", cursor: "pointer", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdispatchedcount.hover(hoverInS, hoverOutS, this.samplereqdispatched, this.samplereqdispatched);
			this.samplereqdispatchedcount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=samplessent";});
			//Sample Requests Delivered
			this.samplereqdelivered = paper.rect(890, 167, 55, 58, 5);
			if (pageStatus=='received') {
				this.samplereqdelivered.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.samplereqdelivered.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.samplereqdelivered.hover(hoverInS, hoverOutS, this.samplereqdelivered, this.samplereqdelivered);
			this.samplereqdelivered.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=received";});
			this.samplereqdeliveredtext = paper.text(918, 190, "Sample\nRequests\nDelivered");
			this.samplereqdeliveredtext.attr({cursor: "pointer", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdeliveredtext.hover(hoverInS, hoverOutS, this.samplereqdelivered, this.samplereqdelivered);
			this.samplereqdeliveredtext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=received";});
			this.samplereqdeliveredcount = paper.text(918, 215, '('+countDelivered+')');
			countColour = (countDelivered == 0 ? "#666" : "#fff");
			this.samplereqdeliveredcount.attr({"fill":countColour, cursor: "pointer", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.samplereqdeliveredcount.hover(hoverInS, hoverOutS, this.samplereqdelivered, this.samplereqdelivered);
			this.samplereqdeliveredcount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=received";});
			//Bottled Under Offer
			this.wineunderoffer = paper.rect(985, 155, 70, 70, 5);
			if (pageStatus=='underoffer') {
				this.wineunderoffer.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.wineunderoffer.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.wineunderoffer.hover(hoverInS, hoverOutS, this.wineunderoffer, this.wineunderoffer);
			this.wineunderoffer.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=underoffer";});
			this.wineunderoffertext = paper.text(1020, 185, "Bottled\nUnder\nOffer");
			this.wineunderoffertext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wineunderoffertext.hover(hoverInS, hoverOutS, this.wineunderoffer, this.wineunderoffer);
			this.wineunderoffertext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=underoffer";});
			this.wineunderoffercount = paper.text(1020, 215, '('+countUnderOffer+')');
			countColour = (actioncountUnderOffer == 0 ? "#666" : "#fff");
			this.wineunderoffercount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wineunderoffercount.hover(hoverInS, hoverOutS, this.wineunderoffer, this.wineunderoffer);
			this.wineunderoffercount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=underoffer";});
			//Bottled to be Dispatched
			this.winetobedispatched = paper.rect(1065, 155, 70, 70, 5);
			if (pageStatus=='contractnote') {
				this.winetobedispatched.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.winetobedispatched.attr({"fill":"90-#c9959c-#fff", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.winetobedispatched.hover(hoverInS, hoverOutS, this.winetobedispatched, this.winetobedispatched);
			this.winetobedispatched.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=contractnote";});
			this.winetobedispatchedtext = paper.text(1100, 185, "Bottled\nTo\nDispatch");
			this.winetobedispatchedtext.attr({cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.winetobedispatchedtext.hover(hoverInS, hoverOutS, this.winetobedispatched, this.winetobedispatched);
			this.winetobedispatchedtext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=contractnote";});
			this.winetobedispatchedcount = paper.text(1100, 215, '('+countToBeDispatched+')');
			countColour = (countToBeDispatched == 0 ? "#666" : "#fff");
			this.winetobedispatchedcount.attr({"fill":countColour, cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.winetobedispatchedcount.hover(hoverInS, hoverOutS, this.winetobedispatched, this.winetobedispatched);
			this.winetobedispatchedcount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/manage-my-selling/?status=contractnote";});

			//Sample Request Archive
			this.sreqarchive = paper.rect(890, 302, 55, 58, 5);
			if (pageStatus=='archive') {
				this.sreqarchive.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.sreqarchive.attr({"fill":"90-#CFA8AE-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.sreqarchive.hover(hoverInS, hoverOutSSA, this.sreqarchive, this.sreqarchive);
			this.sreqarchive.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=archive";});
			this.sreqarchivetext = paper.text(918, 324, "Sample\nRequest\nArchive");
			this.sreqarchivetext.attr({cursor: "pointer", "fill":"#666", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.sreqarchivetext.hover(hoverInS, hoverOutSSA, this.sreqarchive, this.sreqarchive);
			this.sreqarchivetext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=archive";});
			this.sreqarchivecount = paper.text(918, 350, '('+countSampleArchive+')');
			this.sreqarchivecount.attr({"fill":"#666", cursor: "pointer", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.sreqarchivecount.hover(hoverInS, hoverOutSSA, this.sreqarchive, this.sreqarchive);
			this.sreqarchivecount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=archive";});

			//Offer Archive
			this.oarchive = paper.rect(985, 290, 70, 70, 5);
			if (pageStatus=='offerarchive') {
				this.oarchive.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.oarchive.attr({"fill":"90-#CFA8AE-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.oarchive.hover(hoverInS, hoverOutSSA, this.oarchive, this.oarchive);
			this.oarchive.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=offerarchive";});
			this.oarchivetext = paper.text(1020, 320, "Bottled\nOffers\nArchive");
			this.oarchivetext.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.oarchivetext.hover(hoverInS, hoverOutSSA, this.oarchive, this.oarchive);
			this.oarchivetext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=offerarchive";});
			this.oarchivecount = paper.text(1020, 350, '('+countOfferArchive+')');
			this.oarchivecount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.oarchivecount.hover(hoverInS, hoverOutSSA, this.oarchive, this.oarchive);
			this.oarchivecount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=offerarchive";});

			//Bottled Dispatched
			this.wdeliv = paper.rect(1065, 290, 70, 70, 5);
			if (pageStatus=='contractarchive') {
				this.wdeliv.attr({"fill":"url(../../wp-content/themes/winescape/img/backsubmenusellon.png)", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			} else {
				this.wdeliv.attr({"fill":"90-#CFA8AE-#ddd", "stroke-width":1, "stroke":"#999", cursor: "pointer"});
			};
			this.wdeliv.hover(hoverInS, hoverOutSSA, this.wdeliv, this.wdeliv);
			this.wdeliv.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=contractarchive";});
			this.wdelivtext = paper.text(1100, 320, "Bottled\nDispatched");
			this.wdelivtext.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wdelivtext.hover(hoverInS, hoverOutSSA, this.wdeliv, this.wdeliv);
			this.wdelivtext.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=contractarchive";});
			this.wdelivcount = paper.text(1100, 350, '('+countDispatched+')');
			this.wdelivcount.attr({"fill":"#666", cursor: "pointer", "font-size": 12, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" });
			this.wdelivcount.hover(hoverInS, hoverOutSSA, this.wdeliv, this.wdeliv);
			this.wdelivcount.click(function(evt){self.location.href="sell-in-the-winescape-marketplace/my-selling-archive/?status=contractarchive";});

			//Automated
			this.pathet = paper.path("M550,135L750,135L750,120");
			this.pathet.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.ettext = paper.text(790, 105, "BUYER'S SHORTLIST");
			this.ettext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			this.pathet1 = paper.path("M780,115L780,155");
			this.pathet1.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			//Samples Rejected
			this.pathsre = paper.path("M780,230L780,255L918,255");
			this.pathsre.attr({stroke:'#fff', 'stroke-dasharray': '- '});
			this.pathsr = paper.path("M918,230L918,285");
			this.pathsr.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.srtext = paper.text(850, 245, "REJECTED");
			this.srtext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			//Offer Rejected
			this.pathor = paper.path("M1020,230L1020,285");
			this.pathor.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.ortext = paper.text(1030, 257, "REJECTED");
			this.ortext.attr({"fill":"#fff", "font-size": 11, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			this.ortext.transform("r90");
			//Bottled Delivered
			this.pathwd = paper.path("M1100,230L1100,285");
			this.pathwd.attr({stroke:'#fff', 'stroke-dasharray': '- ', 'arrow-end': 'classic-wide-long'});
			this.wdtext = paper.text(1110, 257, "DISPATCHED");
			this.wdtext.attr({"fill":"#fff", "font-size": 10, "font-family": "'lucida grande', 'lucida sans unicode', 'Trebuchet MS', verdana, arial, helvetica, helve, sans-serif" })
			this.wdtext.transform("r90");

			this.blnShow = true;
    	};
    };


	//Map My Selling
	var canvas = document.getElementById("mapmyselling");
	if (canvas) {
		// Creates Raphael canvas on canvas element
		var paper = Raphael(canvas, '100%', '100%');
		// the following line makes the Raphael paper fill its container
		//paper.setViewBox(0, 0, c.width, c.height, true);
		paper.setViewBox(0, 0, 1250, 400, true);

		//Layout
		if (prodType=='Fruit'){
			var mapsupplymarkets = new mapSupplyFruitMarket();
			var mapsubmittotender = new mapSubmitToTender();
			var mapsell = new mapSellingFruit();
			mapsupplymarkets.showMap();
			mapsubmittotender.showMap();
			mapsell.showMap();
		} else if (prodType=='Bulk Wine'){
			var mapsupplymarkets = new mapSupplyWineMarket();
			var mapsubmittotender = new mapSubmitToTender();
			var mapsell = new mapSellingWine();
			mapsupplymarkets.showMap();
			mapsubmittotender.showMap();
			mapsell.showMap();;
		} else if (prodType=='Bottled Wine'){
			var mapsupplymarkets = new mapSupplyBottledMarket();
			var mapsubmittotender = new mapSubmitToTender();
			var mapsell = new mapSellingBottled();
			mapsupplymarkets.showMap();
			mapsubmittotender.showMap();
			mapsell.showMap();
		}

	}

}

function readURL(input, id) {
	$('#imageclear').val('');
	if (input.files && input.files[0]) {
		if ($('input[name=image]').valid()) {
			var reader = new FileReader();
			reader.onload = function (e) {
				$('#image'+id).attr('src', e.target.result);
			}
			$('#image'+id).addClass('prodimage');
			reader.readAsDataURL(input.files[0]);
		}
	}
}
function clearImage(id) {
	$('#image'+id).attr('src', 'https://www.winescape.com.au/wp-content/uploads/productimages/no-prod-image.png');
	$('#imageclear').val('remove');
}

function showElement(idshow, idhide) {
	if (idhide!=undefined) {
		$('#'+idhide).slideUp('slow');
	}
	$('#'+idshow).slideDown('slow');
}

function offerBottledLayout() {
	var contractintentionAD = 'Wine contained in this contract is intended for resale to companies holding liquor licences within Australia. The Buyer is a company registered in Australia and will quote an ABN indicating that wine is not intended for GST Free Supply on a form approved by the Australian Taxation Office. The Supplier will not add Wine Equalisation Tax (WET) to the invoice for wine contained in this contract. Goods and Services Tax GST will be added.';
	var contractintentionAR = 'Wine contained in this contract is intended for resale to the general public within Australia. The Buyer is a company registered in Australia and as such requires that the Supplier will add Wine Equalisation Tax (WET) and Goods and Services Tax (GST) to the invoice for wine outlined in this contract.';
	var contractintentionAE = 'Wine contained in this contract is intended for export. The Buyer is a company registered in Australia and will quote an ABN indicating that wine is intended for GST Free Supply on a form approved by the Australian Taxation Office. The Supplier agrees not to add Wine Equalisation Tax (WET) to the invoice for wine outlined in this contract. Goods and Services Tax (GST) will be added.';
	var contractintentionOE = 'Wine contained in this contract is intended for export. The Buyer is a company registered in a country other than Australia. Wine Equalisation Tax (WET) and Goods and Services Tax (GST) should not be added to the invoice for wine contained in this contract.';
	$('#offercontent').hide();
	if ($('#AUBusiness option:selected').val()=='Yes') {
		$('#offerselectorexport').slideDown('slow');
		if ($('#Export option:selected').val()=='Australia') {
			$('#offerselectorsellingto').slideDown('slow');
			if ($('#SellingTo option:selected').val()=='General Public') {
			} else if ($('#SellingTo option:selected').val()=='Liquor Licence') {
			}
		} else {
			$('#SellingTo').val('');
			$('#offerselectorsellingto').slideUp('slow');
		}
	} else {
		$('#Export').val('');
		$('#SellingTo').val('');
		$('#offerselectorexport').slideUp('slow');
		$('#offerselectorsellingto').slideUp('slow');
	}
	//Offer Title and content hide whens
	$('#offertitle').html('<h1>Offer</h1>');
	$('#contractintention').html('');
	if ($('#SellingTo option:selected').val()=='Liquor Licence') {
		$('#WETExemptStatus').val('Sale is WET exempt');
		$('#offertitle').html('<h1>Domestic Wholesale Offer</h1><h3>Australian Distributor WET Exempt form</h3>');
		$('#titleintention').html('Domestic Wholesale Tax Status:');
		$('#contractintention').html(contractintentionAD);
		$('#LUCc').show();
		$('#LUCb').show();
		$('#LUCoc').show();
		$('#LUCob').show();
		$selrisk = $("select[name='RiskOfCarriage']");
		var riskselected = $selrisk.val();
		$("select[name='RiskOfCarriage'] option").remove();
		$('<option value=""></option>').appendTo($selrisk);
		$('<option value="FIS - Free into Store">FIS - Free into Store</option>').appendTo($selrisk);
		$('<option value="DWFF - Delivered with Freight Fee">DWFF - Delivered with Freight Fee</option>').appendTo($selrisk);
		$('<option value="EXW - Ex works">EXW - Ex works</option>').appendTo($selrisk);
		$selrisk.val(riskselected);
		$('#offercontent').slideDown('slow');
	} else if ($('#SellingTo option:selected').val()=='General Public') {
		$('#WETExemptStatus').val('Sale is not WET exempt');
		$('#offertitle').html('<h1>Domestic Retail Offer</h1>');
		$('#titleintention').html('Domestic Retail Tax Status:');
		$('#contractintention').html(contractintentionAR);
		$('#LUCc').show();
		$('#LUCb').show();
		$('#LUCoc').show();
		$('#LUCob').show();
		$selrisk = $("select[name='RiskOfCarriage']");
		var riskselected = $selrisk.val();
		$("select[name='RiskOfCarriage'] option").remove();
		$('<option value=""></option>').appendTo($selrisk);
		$('<option value="FIS - Free into Store">FIS - Free into Store</option>').appendTo($selrisk);
		$('<option value="DWFF - Delivered with Freight Fee">DWFF - Delivered with Freight Fee</option>').appendTo($selrisk);
		$('<option value="EXW - Ex works">EXW - Ex works</option>').appendTo($selrisk);
		$selrisk.val(riskselected);
		$('#offercontent').slideDown('slow');
	} else if ($('#Export option:selected').val()=='Export') {
		$('#WETExemptStatus').val('Sale is WET exempt');
		$('#offertitle').html('<h1>Domestic Export Offer</h1>')//'<h3>Australian Export WET Exempt form</h3>');
		$('#titleintention').html('Domestic Export Tax Status:');
		$('#contractintention').html(contractintentionAE);
		$('#LUCc').hide();
		$('#LUCb').hide();
		$('#LUCoc').hide();
		$('#LUCob').hide();
		$selrisk = $("select[name='RiskOfCarriage']");
		var riskselected = $selrisk.val();
		$("select[name='RiskOfCarriage'] option").remove();
		$('<option value=""></option>').appendTo($selrisk);
		$('<option value="CFR - Cost and freight">CFR - Cost and freight</option>').appendTo($selrisk);
		$('<option value="CIF - Cost, insurance and freight">CIF - Cost, insurance and freight</option>').appendTo($selrisk);
		$('<option value="CIP - Carriage and insurance paid to">CIP - Carriage and insurance paid to</option>').appendTo($selrisk);
		$('<option value="CPT - Carriage paid to">CPT - Carriage paid to</option>').appendTo($selrisk);
		$('<option value="DAF - Delivered at frontier">DAF - Delivered at frontier</option>').appendTo($selrisk);
		$('<option value="DDP - Delivered duty paid">DDP - Delivered duty paid</option>').appendTo($selrisk);
		$('<option value="DDU - Delivered duty unpaid">DDU - Delivered duty unpaid</option>').appendTo($selrisk);
		$('<option value="DEQ - Delivery ex quay">DEQ - Delivery ex quay</option>').appendTo($selrisk);
		$('<option value="DES - Delivery ex ship">DES - Delivery ex ship</option>').appendTo($selrisk);
		$('<option value="EXW - Ex works">EXW - Ex works</option>').appendTo($selrisk);
		$('<option value="FAS - Free alongside ship">FAS - Free alongside ship</option>').appendTo($selrisk);
		$('<option value="FCA - Free carrier">FCA - Free carrier</option>').appendTo($selrisk);
		$('<option value="FOB - Free on board">FOB - Free on board</option>').appendTo($selrisk);
		$selrisk.val(riskselected);
		$('#offercontent').slideDown('slow');
	} else if ($('#AUBusiness option:selected').val()=='No') {
		$('#WETExemptStatus').val('Sale is WET exempt');
		$('#offertitle').html('<h1>International Export Offer</h1>');
		$('#titleintention').html('International Export Tax Status:');
		$('#contractintention').html(contractintentionOE);
		$('#LUCc').hide();
		$('#LUCb').hide();
		$('#LUCoc').hide();
		$('#LUCob').hide();
		$selrisk = $("select[name='RiskOfCarriage']");
		var riskselected = $selrisk.val();
		$("select[name='RiskOfCarriage'] option").remove();
		$('<option value=""></option>').appendTo($selrisk);
		$('<option value="CFR - Cost and freight">CFR - Cost and freight</option>').appendTo($selrisk);
		$('<option value="CIF - Cost, insurance and freight">CIF - Cost, insurance and freight</option>').appendTo($selrisk);
		$('<option value="CIP - Carriage and insurance paid to">CIP - Carriage and insurance paid to</option>').appendTo($selrisk);
		$('<option value="CPT - Carriage paid to">CPT - Carriage paid to</option>').appendTo($selrisk);
		$('<option value="DAF - Delivered at frontier">DAF - Delivered at frontier</option>').appendTo($selrisk);
		$('<option value="DDP - Delivered duty paid">DDP - Delivered duty paid</option>').appendTo($selrisk);
		$('<option value="DDU - Delivered duty unpaid">DDU - Delivered duty unpaid</option>').appendTo($selrisk);
		$('<option value="DEQ - Delivery ex quay">DEQ - Delivery ex quay</option>').appendTo($selrisk);
		$('<option value="DES - Delivery ex ship">DES - Delivery ex ship</option>').appendTo($selrisk);
		$('<option value="EXW - Ex works">EXW - Ex works</option>').appendTo($selrisk);
		$('<option value="FAS - Free alongside ship">FAS - Free alongside ship</option>').appendTo($selrisk);
		$('<option value="FCA - Free carrier">FCA - Free carrier</option>').appendTo($selrisk);
		$('<option value="FOB - Free on board">FOB - Free on board</option>').appendTo($selrisk);
		$selrisk.val(riskselected);
		$('#offercontent').slideDown('slow');
	} else if ($('#perspective').val() == 'supplier') {
		$('#offercontent').slideDown('slow');
	}
	if ($('#offercontent').is(':visible')) {
		$('#offerinstructions').hide();
	} else {
		$('#offerinstructions').show();
	}
	displayFreight();
}


function offerBulkLayout() {
	var contractintentionAD = 'Wine contained in this contract is intended for resale to companies holding liquor licences within Australia. The Buyer is a company registered in Australia and will quote an ABN indicating that wine is not intended for GST Free Supply on a form approved by the Australian Taxation Office. The Supplier will not add Wine Equalisation Tax (WET) to the invoice for wine contained in this contract. Goods and Services Tax GST will be added.';
	var contractintentionAR = 'Wine contained in this contract is intended for resale to the general public within Australia. The Buyer is a company registered in Australia and as such requires that the Supplier will add Wine Equalisation Tax (WET) and Goods and Services Tax (GST) to the invoice for wine outlined in this contract.';
	var contractintentionAE = 'Wine contained in this contract is intended for export. The Buyer is a company registered in Australia and will quote an ABN indicating that wine is intended for GST Free Supply on a form approved by the Australian Taxation Office. The Supplier agrees not to add Wine Equalisation Tax (WET) to the invoice for wine outlined in this contract. Goods and Services Tax (GST) will be added.';
	var contractintentionOE = 'Wine contained in this contract is intended for export. The Buyer is a company registered in a country other than Australia. Wine Equalisation Tax (WET) and Goods and Services Tax (GST) should not be added to the invoice for wine contained in this contract.';
	$('#offercontent').hide();
	if ($('#AUBusiness option:selected').val()=='Yes') {
		$('#offerselectorexport').slideDown('slow');
		if ($('#Export option:selected').val()=='Domestic') {
			$('#offerselectorsellingto').slideDown('slow');
			if ($('#SellingTo option:selected').val()=='Not Quote') {
			} else if ($('#SellingTo option:selected').val()=='Quote') {
			}
		} else {
			$('#SellingTo').val('');
			$('#offerselectorsellingto').slideUp('slow');
		}
	} else {
		$('#Export').val('');
		$('#SellingTo').val('');
		$('#offerselectorexport').slideUp('slow');
		$('#offerselectorsellingto').slideUp('slow');
	}
	//Offer Title and content hide whens
	$('#offertitle').html('<h1>Offer</h1>');
	$('#contractintention').html('Sale is not WET exempt');
	if ($('#SellingTo option:selected').val()=='Quote') {
		$('#WETExemptStatus').val('Sale is WET exempt');
		$('#offertitle').html('<h1>Domestic Wholesale Offer</h1><h3>Australian Distributor WET Exempt form</h3>');
		$('#titleintention').html('Domestic Wholesale Tax Status:');
		$('#contractintention').html(contractintentionAD);
		$('#LUCc').show();
		$('#LUCb').show();
		$('#LUCoc').show();
		$('#LUCob').show();
		$selrisk = $("select[name='RiskOfCarriage']");
		var riskselected = $selrisk.val();
		$("select[name='RiskOfCarriage'] option").remove();
		$('<option value=""></option>').appendTo($selrisk);
		$('<option value="FIS - Free into Store">FIS - Free into Store</option>').appendTo($selrisk);
		$('<option value="DWFF - Delivered with Freight Fee">DWFF - Delivered with Freight Fee</option>').appendTo($selrisk);
		$('<option value="EXW - Ex works">EXW - Ex works</option>').appendTo($selrisk);
		$selrisk.val(riskselected);
		// $('#offercontent').slideDown('slow');
    toggleSectionDisplay('pricequantity');
	} else if ($('#SellingTo option:selected').val()=='Not Quote') {
		$('#WETExemptStatus').val('Sale is not WET exempt');
		$('#offertitle').html('<h1>Domestic Retail Offer</h1>');
		$('#titleintention').html('Domestic Retail Tax Status:');
		$('#contractintention').html(contractintentionAR);
		$('#LUCc').show();
		$('#LUCb').show();
		$('#LUCoc').show();
		$('#LUCob').show();
		$selrisk = $("select[name='RiskOfCarriage']");
		var riskselected = $selrisk.val();
		$("select[name='RiskOfCarriage'] option").remove();
		$('<option value=""></option>').appendTo($selrisk);
		$('<option value="FIS - Free into Store">FIS - Free into Store</option>').appendTo($selrisk);
		$('<option value="DWFF - Delivered with Freight Fee">DWFF - Delivered with Freight Fee</option>').appendTo($selrisk);
		$('<option value="EXW - Ex works">EXW - Ex works</option>').appendTo($selrisk);
		$selrisk.val(riskselected);
		// $('#offercontent').slideDown('slow');
    toggleSectionDisplay('pricequantity');
	} else if ($('#Export option:selected').val()=='Export') {
		$('#WETExemptStatus').val('Sale is WET exempt');
		$('#offertitle').html('<h1>Domestic Export Offer</h1>');//'<h3>Australian Export WET Exempt form</h3>');
		$('#titleintention').html('Domestic Export Tax Status:');
		$('#contractintention').html(contractintentionAE);
		$('#LUCc').hide();
		$('#LUCb').hide();
		$('#LUCoc').hide();
		$('#LUCob').hide();
		$selrisk = $("select[name='RiskOfCarriage']");
		var riskselected = $selrisk.val();
		$("select[name='RiskOfCarriage'] option").remove();
		$('<option value=""></option>').appendTo($selrisk);
		$('<option value="CFR - Cost and freight">CFR - Cost and freight</option>').appendTo($selrisk);
		$('<option value="CIF - Cost, insurance and freight">CIF - Cost, insurance and freight</option>').appendTo($selrisk);
		$('<option value="CIP - Carriage and insurance paid to">CIP - Carriage and insurance paid to</option>').appendTo($selrisk);
		$('<option value="CPT - Carriage paid to">CPT - Carriage paid to</option>').appendTo($selrisk);
		$('<option value="DAF - Delivered at frontier">DAF - Delivered at frontier</option>').appendTo($selrisk);
		$('<option value="DAP - Delivered at place">DAP - Delivered at place</option>').appendTo($selrisk);
		$('<option value="DAT - Delivered at terminal">DAT - Delivered at terminal</option>').appendTo($selrisk);
		$('<option value="DDP - Delivered duty paid">DDP - Delivered duty paid</option>').appendTo($selrisk);
		$('<option value="DDU - Delivered duty unpaid">DDU - Delivered duty unpaid</option>').appendTo($selrisk);
		$('<option value="DEQ - Delivery ex quay">DEQ - Delivery ex quay</option>').appendTo($selrisk);
		$('<option value="DES - Delivery ex ship">DES - Delivery ex ship</option>').appendTo($selrisk);
		$('<option value="EXW - Ex works">EXW - Ex works</option>').appendTo($selrisk);
		$('<option value="FAS - Free alongside ship">FAS - Free alongside ship</option>').appendTo($selrisk);
		$('<option value="FCA - Free carrier">FCA - Free carrier</option>').appendTo($selrisk);
		$('<option value="FOB - Free on board">FOB - Free on board</option>').appendTo($selrisk);
		$selrisk.val(riskselected);
    // toggleSectionDisplay('pricequantity');
    toggleSectionDisplay('pricequantity');
	} else if ($('#AUBusiness option:selected').val()=='No') {
		$('#WETExemptStatus').val('Sale is WET exempt');
		$('#offertitle').html('<h1>International Export Offer</h1>');
		$('#titleintention').html('International Export Tax Status:');
		$('#contractintention').html(contractintentionOE);
		$('#LUCc').hide();
		$('#LUCb').hide();
		$('#LUCoc').hide();
		$('#LUCob').hide();
		$selrisk = $("select[name='RiskOfCarriage']");
		var riskselected = $selrisk.val();
		$("select[name='RiskOfCarriage'] option").remove();
		$('<option value=""></option>').appendTo($selrisk);
		$('<option value="CFR - Cost and freight">CFR - Cost and freight</option>').appendTo($selrisk);
		$('<option value="CIF - Cost, insurance and freight">CIF - Cost, insurance and freight</option>').appendTo($selrisk);
		$('<option value="CIP - Carriage and insurance paid to">CIP - Carriage and insurance paid to</option>').appendTo($selrisk);
		$('<option value="CPT - Carriage paid to">CPT - Carriage paid to</option>').appendTo($selrisk);
		$('<option value="DAF - Delivered at frontier">DAF - Delivered at frontier</option>').appendTo($selrisk);
		$('<option value="DAP - Delivered at place">DAP - Delivered at place</option>').appendTo($selrisk);
		$('<option value="DAT - Delivered at terminal">DAT - Delivered at terminal</option>').appendTo($selrisk);
		$('<option value="DDP - Delivered duty paid">DDP - Delivered duty paid</option>').appendTo($selrisk);
		$('<option value="DDU - Delivered duty unpaid">DDU - Delivered duty unpaid</option>').appendTo($selrisk);
		$('<option value="DEQ - Delivery ex quay">DEQ - Delivery ex quay</option>').appendTo($selrisk);
		$('<option value="DES - Delivery ex ship">DES - Delivery ex ship</option>').appendTo($selrisk);
		$('<option value="EXW - Ex works">EXW - Ex works</option>').appendTo($selrisk);
		$('<option value="Farmgate">Farmgate</option>').appendTo($selrisk);
		$('<option value="FAS - Free alongside ship">FAS - Free alongside ship</option>').appendTo($selrisk);
		$('<option value="FCA - Free carrier">FCA - Free carrier</option>').appendTo($selrisk);
		$('<option value="FOB - Free on board">FOB - Free on board</option>').appendTo($selrisk);
		$selrisk.val(riskselected);
		// $('#offercontent').slideDown('slow');
    toggleSectionDisplay('pricequantity');
	}
	else if ($('#perspective').val() == 'supplier') {
		// $('#offercontent').slideDown('slow');
    toggleSectionDisplay('pricequantity');
	}
	displayFreight();
}

function toggleSectionDisplay(stage)
{

  if (stage !== '') {
    $('#' + stage).show();
  }
  else {
    if ($('#terms').is(':visible'))
      $('#address').slideDown('slow');

    if ($('#drawdown').is(':visible'))
      $('#terms').slideDown('slow');

    if ($('#pricequantity').is(':visible'))
      $('#drawdown').slideDown('slow');

    if ($('#address').is(':visible'))
      $('#nextstep').hide();

  }

  $('#offercontent').slideDown('slow');

  if ($('#offercontent').is(':visible')) {
    $('#offerinstructions').hide();
  } else {
    $('#offerinstructions').show();
  }
}


function buildDateFields(prodtype) {
	//Grab any existing qtys
	var qtys = [];
	var qty = '';
	var qtyval = '';
	$(".delqty").each(function() {
		qty = $(this).val();
		qtys.push(qty);
	});
	//On or laters
	var onlaters = [];
	var onlater = '';
	var onlaterval = '';
	$(".delonlater").each(function() {
		onlater = $(this).val();
		onlaters.push(onlater);
	});
	if (prodtype == 'bulk') {
		var units = "litres"
	} else {
		var units = "cases"
	}
	//Loop each date and build the field layouts
	var htmlfields = '<br /><ul>';
	var dates = $('#DateSelection').val().split(', ');
	for (i = 0; i < dates.length; i++) {
		if (dates[i] != '') {
			qtyval = (qtys[i] == undefined) ? '' : qtys[i];
			if (onlaters[i] == 'on') {
				onlaterval = '<select class="delonlater" name="DelOnLater' + i + '" onchange="calcTotalCommit();"><option selected>on</option><option>no later than</option></select>';
			} else if (onlaters[i] == 'no later than') {
				onlaterval = '<select class="delonlater" name="DelOnLater' + i + '" onchange="calcTotalCommit();"><option>on</option><option selected>no later than</option></select>';
			} else {
				onlaterval = '<select class="delonlater" name="DelOnLater' + i + '" onchange="calcTotalCommit();"><option>on</option><option>no later than</option></select>';
			}
			//htmlfields += '<li>' + dates[i] + ' - <input type="text" class="delqty" name="DelQty' + i + '" value="' + qtyval + '" onchange="calcTotalCommit();" /></li>';
			htmlfields += '<li>Drawdown #' + (i+1) + ' <input type="text" class="delqty" name="DelQty' + i + '" value="' + qtyval + '" onchange="calcTotalCommit();" /> ' + units + ' to be drawn down ' + onlaterval + ' ' + dates[i] + '</li>';
		}
	}
	htmlfields += '</ul>';
	$('#datefields').html(htmlfields);
	loadDeliveryQtys();
	calcTotalCommit();
}


function loadDeliveryQtys() {
	//The dates have been done by the calendar plugin, so have to do the qtys
	var delqtys = $('#DeliveryQtys').val().split(', ');
	for (i = 0; i < delqtys.length; i++) {
		if (delqtys[i] != '') {
			$('input[name="DelQty'+ i +'"]').val(delqtys[i]);
		}
	}
	//onlaters
	var delonlaters = $('#DeliveryOnNoLater').val().split(', ');
	for (i = 0; i < delonlaters.length; i++) {
		if (delonlaters[i] != '') {
			$('select[name="DelOnLater'+ i +'"]').val(delonlaters[i]);
		}
	}
	//checkDrawdownWarnings();
}

function checkDrawdownWarnings(){
	//Test for minimum commit
	var warn = '';
	if (parseFloat($('#TotalCommit').val()) <= parseFloat($('#mincommit').val())) {
		warn = warn + '<br />Please be advised that your commitment quantity is less than the minimum commitment quantity.';
	}
	//Test for more than x months (31 days)
	var dates = $('#DateSelection').val().split(', ');
	if (dates[dates.length-1] != '') {
		var myDate=dates[dates.length-1];
		myDate=myDate.split("/");
		var startDt=myDate[2]+"-"+myDate[1]+"-"+myDate[0];
		var endDt=document.getElementById("maxperiod").value;
		if( (new Date(startDt).getTime() > new Date(endDt).getTime())) {
			warn = warn + '<br />Please be advised that your drawdown period exceeds the maximum drawdown period.';
		}
	}
	// var diff =  Math.floor(( Date.parse(str2) - Date.parse(str1) ) / 86400000);
	if (warn != '') {
		warn = warn + '<br />You may still submit your offer, however the supplier may not accept this drawdown schedule.';
	}
	$('#drawdownwarnings').html(warn)

}


function calcLUCs() {
	var offerprice = $('#BuyOfferPrice').val();
	var casesize = $('#casesize').val();
	var lucc = offerprice * 1.29;
	var lucb = (offerprice * 1.29) / casesize;
	$("#LUCocd").html('$' + lucc.toFixed(2));
	$('#LUCobd').html('$' + lucb.toFixed(2));
}





function calcTotalCommit() {
	var sum = 0;
	var strQtys = '';
	var strOnLaters = '';
	//iterate through each textboxes and add the values
	$(".delqty").each(function() {
		if (strQtys != '') { strQtys = strQtys + ', '};
		strQtys = strQtys + this.value;
		//add only if the value is number
		if(!isNaN(this.value) && this.value.length!=0) {
			sum += parseFloat(this.value);
		}
	});
	//onlaters
	$(".delonlater").each(function() {
		if (strOnLaters != '') { strOnLaters = strOnLaters + ', '};
		strOnLaters = strOnLaters + this.value;
	});
	//.toFixed() method will roundoff the final sum to 0 decimal places
	$("#TotalCommit").val(sum.toFixed(0));
	$('#DeliveryQtys').val(strQtys);
	$('#DeliveryOnNoLater').val(strOnLaters);
	//checkDrawdownWarnings();
}



function showHideAddresses() {
	//Addresses
	if ($('#RiskOfCarriage').val() == 'EXW - Ex works') {
		$('#trAddDisp').slideDown('slow');
	} else {
		$('#trAddDisp').slideUp('slow');
	}
	displayFreight();
}


function displayFreight() {
	if ($('#RiskOfCarriage').val() == 'DWFF - Delivered with Freight Fee') {
		$('#trFreightFee').show();
	} else {
		$('#trFreightFee').hide();
	}
}


$.fn.insertAtCaret = function (myValue) {
	return this.each(function(){
			//IE support
			if (document.selection) {
					this.focus();
					sel = document.selection.createRange();
					sel.text = myValue;
					this.focus();
			}
			//MOZILLA / NETSCAPE support
			else if (this.selectionStart || this.selectionStart == '0') {
					var startPos = this.selectionStart;
					var endPos = this.selectionEnd;
					var scrollTop = this.scrollTop;
					this.value = this.value.substring(0, startPos)+ myValue+ this.value.substring(endPos,this.value.length);
					this.focus();
					this.selectionStart = startPos + myValue.length;
					this.selectionEnd = startPos + myValue.length;
					this.scrollTop = scrollTop;
			} else {
					this.value += myValue;
					this.focus();
			}
	});
};

function cancelContract() {
	$('#cancelcontract').hide();
	$('#cancelcontractfields').slideDown('slow');
}

function reinstateContract() {
	$('#reinstatecontract').hide();
	$('#cancelcontractfields').slideUp('slow', saveReinstateContract());
}

function reviseCancelledContract() {
	$('#revisedcontract').slideUp('slow', revisedOfferCancelledContract());
}
