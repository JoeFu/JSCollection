// date format
$.validator.addMethod(
    "australianDate",
    function(value, element) {
        // put your own logic here, this is just a (crappy) example
        return value.match(/^\d\d?\/\d\d?\/\d\d\d\d$/);
    },
    "Please enter a date in the format dd/mm/yyyy."
);


//移动设备判断
var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i) ? true : false;
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i) ? true : false;
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) ? true : false;
    },
Phone: function() {
return navigator.userAgent.match(/Mobile/i) ? true : false;
},
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.Windows() || isMobile.Phone());
    }
};

function isIE () {
var myNav = navigator.userAgent.toLowerCase();
return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
};


